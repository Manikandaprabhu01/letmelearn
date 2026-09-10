import { ArchDiagram } from "@/components/content/ArchDiagram";
import type { ArchitectureBoard as Board } from "@/data/types";

export function ArchitectureBoard({ board }: { board: Board }) {
  return (
    <section>
      <h2 className="font-display text-xl font-medium tracking-tight sm:text-2xl">Architecture</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Read the board left to right. Accent boxes are the hot path. Then walk the numbered hops —
        that is the explanation you should give out loud in the interview.
      </p>
      <ArchDiagram
        diagram={{
          kind: "system",
          caption: board.caption,
          columns: board.columns,
        }}
      />
      <ol className="mt-2 space-y-3">
        {board.walkthrough.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="mt-0.5 font-mono text-xs text-accent tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="font-medium leading-snug">{step.title}</div>
              <p className="mt-1 text-sm leading-6 text-muted">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
