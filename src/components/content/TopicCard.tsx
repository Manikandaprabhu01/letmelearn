import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

type SlugTo =
  | "/hld/$slug"
  | "/lld/$slug"
  | "/fde/$slug"
  | "/java/$slug"
  | "/python/$slug"
  | "/examples/$slug"
  | "/playgrounds/$slug"
  | "/interview-prep/$slug";

/**
 * A card in a track index. Title first — it is what the reader is scanning for —
 * then the sentence, then metadata in mono at the bottom where it does not
 * interrupt. Elevation is a hairline ring that strengthens on hover.
 */
export function TopicCard({
  to,
  slug,
  kicker,
  title,
  subtitle,
  tags,
  id,
}: {
  to: SlugTo;
  slug: string;
  kicker?: string;
  title: string;
  subtitle: string;
  tags?: string[];
  id: string;
}) {
  const done = useProgress((s) => Boolean(s.done[id]));
  return (
    <Link
      to={to}
      params={{ slug }}
      className="glass-card-interactive group flex flex-col rounded-xl p-4.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[15px] font-medium leading-6 text-fg group-hover:text-accent transition-colors">
          {title}
        </h3>
        <span
          className={cn(
            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full transition-colors",
            done ? "bg-ok/20 text-ok" : "text-transparent group-hover:text-faint",
          )}
          aria-hidden
        >
          <Check className="size-3" />
        </span>
      </div>
      <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-relaxed text-muted">{subtitle}</p>
      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-border/50 pt-2.5">
        {kicker ? <span className="font-mono text-[11px] text-faint truncate">{kicker}</span> : <span />}
        {tags?.length ? (
          <span className="rounded bg-raised/80 px-2 py-0.5 font-mono text-[10px] text-muted border border-border/60">
            {tags[0]}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
