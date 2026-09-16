import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DifficultyChip, LeetCodeChip, PlainChip, TypeChip } from "@/components/interview/Chips";
import { CompanyHeader, EmptyQuestions } from "@/components/interview/CompanyHeader";
import { MdBullets, MdInline } from "@/components/interview/Md";
import { useVisibleQuestions } from "@/components/interview/use-visible-questions";
import { LEVEL_SHORT } from "@/data/interview/meta";
import type { Company } from "@/data/interview/types";
import { useInterviewPrefs } from "@/lib/interview-prefs";
import { cn } from "@/lib/utils";

function Section({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl tracking-tight">{title}</h2>
      {sub ? <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{sub}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-raised eyebrow">
          <tr>
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

const cell = "px-3 py-2 align-top text-muted";

export function CompanyBank({ company }: { company: Company }) {
  const level = useInterviewPrefs((s) => s.level);
  const visible = useVisibleQuestions(company.bank);
  const loop = company.loop.filter((r) => r.levels.includes(level));
  const rounds = [...new Set(visible.map((v) => v.q.round))].sort((a, b) => a - b);

  return (
    <>
      <CompanyHeader company={company} view="bank" />

      <Section
        title="Level ladder"
        sub="Your level is highlighted. Switch levels in the bar above to re-filter the loop and every question below."
      >
        <Table head={["Level", "Their title", "YoE", "Loop", "What clears the bar"]}>
          {company.ladder.map((l) => (
            <tr
              key={l.lvl}
              className={cn("border-t border-border", l.lvl === level && "bg-accent/8")}
            >
              <td className="whitespace-nowrap px-3 py-2 align-top font-medium text-fg">{l.lvl}</td>
              <td className={cell}>{l.internal}</td>
              <td className={cn(cell, "whitespace-nowrap")}>{l.yoe}</td>
              <td className={cell}>{l.loop}</td>
              <td className={cell}>
                <MdInline text={l.bar} />
              </td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title={`Interview loop at ${level}`} sub="The rounds that apply at this level.">
        {loop.length ? (
          <Table head={["#", "Round", "Length", "Format", "What it tests"]}>
            {loop.map((r) => (
              <tr key={r.n} className="border-t border-border">
                <td className="px-3 py-2 align-top font-mono text-xs text-accent">{r.n}</td>
                <td className="px-3 py-2 align-top font-medium text-fg">{r.name}</td>
                <td className={cn(cell, "whitespace-nowrap")}>{r.dur}</td>
                <td className={cell}>{r.fmt}</td>
                <td className={cell}>
                  <MdInline text={r.tests} />
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="text-sm text-faint">
            No rounds are listed for {level} at {company.name}.
          </p>
        )}
      </Section>

      <Section
        title="Question bank"
        sub={`${visible.length} question${visible.length === 1 ? "" : "s"} at ${level}. Select one to open its worked answer.`}
      >
        {visible.length === 0 ? (
          <EmptyQuestions />
        ) : (
          rounds.map((rn) => (
            <div key={rn} className="mt-6 first:mt-0">
              <h3 className="font-mono eyebrow">
                Round {rn} · {company.loop.find((r) => r.n === rn)?.name ?? `Round ${rn}`}
              </h3>
              <ul className="mt-1">
                {visible
                  .filter((v) => v.q.round === rn)
                  .map(({ q, index }) => (
                    <li
                      key={index}
                      className="grid gap-x-4 gap-y-1.5 border-b border-border py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <Link
                        to="/interview-prep/$slug/answers"
                        params={{ slug: company.id }}
                        hash={`q-${index}`}
                        className="text-[14.5px] font-medium leading-6 text-fg hover:text-accent"
                      >
                        {q.q}
                      </Link>
                      <span className="flex flex-wrap items-start gap-1 sm:max-w-[18rem] sm:justify-end">
                        <TypeChip type={q.t} />
                        <DifficultyChip d={q.d} />
                        <LeetCodeChip lc={q.lc} slug={q.slug} />
                        {q.ans ? (
                          <PlainChip title="Answered once in the shared library, and reused by every company that asks it">
                            shared
                          </PlainChip>
                        ) : null}
                        {q.lv.map((l) => (
                          <PlainChip key={l}>{LEVEL_SHORT[l]}</PlainChip>
                        ))}
                      </span>
                      {q.note ? (
                        <p className="text-[13px] leading-6 text-muted sm:col-span-2">
                          <MdInline text={q.note} />
                        </p>
                      ) : null}
                    </li>
                  ))}
              </ul>
            </div>
          ))
        )}
      </Section>

      {company.prep.length ? (
        <Section title="Prep notes">
          <MdBullets items={company.prep} />
        </Section>
      ) : null}

      <Section title="Sources">
        <ul className="space-y-1.5 text-[14px] leading-6">
          {company.sources.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-[10px] size-1 shrink-0 rounded-full bg-accent/60" />
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-prose text-[13px] leading-6 text-faint">
          Round structures and questions come from published candidate reports, company guides and
          the major prep sites. Loops change — treat this as a strong prior and confirm the current
          format with your recruiter.
        </p>
      </Section>
    </>
  );
}
