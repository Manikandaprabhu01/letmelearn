import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * The console's markdown subset: **bold**, `code`, "- " and "1. " list lines,
 * blank-line paragraphs and single newlines as line breaks. Rendered as React
 * elements, never as HTML, so nothing in the text can inject markup.
 */

const BULLET = /^\s*-\s+/;
const NUMBERED = /^\s*\d+\.\s+/;

function codeSpans(text: string, key: string): ReactNode[] {
  // With a capturing split, matches land on the odd indices.
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    i % 2 === 1 ? (
      <code
        key={`${key}-${i}`}
        className="rounded bg-inset px-1 py-px font-mono text-[0.86em] text-fg"
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      <Fragment key={`${key}-${i}`}>{part}</Fragment>
    ),
  );
}

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  text.split("\n").forEach((line, li) => {
    if (li > 0) out.push(<br key={`br-${li}`} />);
    line.split(/(\*\*[^*]+\*\*)/g).forEach((part, pi) => {
      if (!part) return;
      const key = `${li}-${pi}`;
      if (pi % 2 === 1) {
        out.push(
          <strong key={key} className="font-semibold text-fg">
            {codeSpans(part.slice(2, -2), key)}
          </strong>,
        );
      } else {
        out.push(...codeSpans(part, key));
      }
    });
  });
  return out;
}

type Run = { kind: "text" | "bullet" | "numbered"; lines: string[] };

/** Splits a paragraph into runs, so "Intro:\n- a\n- b" becomes a line and a list. */
function runs(block: string): Run[] {
  const out: Run[] = [];
  for (const line of block.split("\n")) {
    const kind = BULLET.test(line) ? "bullet" : NUMBERED.test(line) ? "numbered" : "text";
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.lines.push(line);
    else out.push({ kind, lines: [line] });
  }
  return out;
}

export function MdInline({ text }: { text?: string }) {
  if (!text) return null;
  return <>{inline(text.trim())}</>;
}

export function MdBullets({ items, className }: { items?: string[]; className?: string }) {
  if (!items?.length) return null;
  return (
    <ul className={cn("max-w-prose space-y-1.5 text-[14.5px] leading-7 text-muted", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-[11px] size-1 shrink-0 rounded-full bg-accent" />
          <span>{inline(item.trim())}</span>
        </li>
      ))}
    </ul>
  );
}

export function Md({ text, className }: { text?: string; className?: string }) {
  if (!text?.trim()) return null;
  const blocks = text
    .trim()
    .split(/\n\n+/)
    .flatMap((block) => runs(block));
  return (
    <div className={cn("max-w-prose space-y-3 text-[14.5px] leading-7 text-muted", className)}>
      {blocks.map((run, i) => {
        if (run.kind === "bullet") {
          return (
            <ul key={i} className="space-y-1.5">
              {run.lines.map((l, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-[11px] size-1 shrink-0 rounded-full bg-accent" />
                  <span>{inline(l.replace(BULLET, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (run.kind === "numbered") {
          return (
            <ol key={i} className="space-y-1.5">
              {run.lines.map((l, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-[3px] font-mono text-xs tabular-nums text-accent">
                    {(l.match(/\d+/)?.[0] ?? String(j + 1)).padStart(2, "0")}
                  </span>
                  <span>{inline(l.replace(NUMBERED, ""))}</span>
                </li>
              ))}
            </ol>
          );
        }
        return <p key={i}>{inline(run.lines.join("\n"))}</p>;
      })}
    </div>
  );
}
