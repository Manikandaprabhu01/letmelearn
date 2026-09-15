import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/** A collapsible answer. Its body renders only while open — see useOpenCards. */
export function AnswerCard({
  id,
  open,
  onOpenChange,
  title,
  chips,
  preview,
  children,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  chips?: ReactNode;
  preview?: string;
  children: ReactNode;
}) {
  return (
    <details
      id={id}
      open={open}
      // Fires for clicks and for programmatic changes alike; only report real changes.
      onToggle={(e) => {
        const next = e.currentTarget.open;
        if (next !== open) onOpenChange(next);
      }}
      className="group scroll-mt-32 rounded-lg border border-border bg-surface open:border-border-strong"
    >
      <summary className="flex cursor-pointer list-none gap-3 rounded-lg px-4 py-3 hover:bg-raised/50 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="mt-1 size-4 shrink-0 text-faint transition-transform duration-150 group-open:rotate-90" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <span className="text-[14.5px] font-medium leading-6 text-fg">{title}</span>
            {chips ? (
              <span className="flex flex-wrap items-center gap-1 sm:max-w-[45%] sm:justify-end sm:pl-3">
                {chips}
              </span>
            ) : null}
          </div>
          {preview && !open ? (
            <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-faint">{preview}</p>
          ) : null}
        </div>
      </summary>
      {open ? <div className="border-t border-border px-4 pb-6 sm:px-5">{children}</div> : null}
    </details>
  );
}
