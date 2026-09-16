import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      className="group flex flex-col rounded-lg bg-surface p-4 shadow-panel transition-[background-color,box-shadow] duration-150 hover:bg-raised hover:shadow-[inset_0_0_0_1px_var(--color-border-strong)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[15px] leading-6 text-fg">{title}</h3>
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
      <p className="mt-1.5 line-clamp-2 flex-1 text-[13.5px] leading-6 text-muted">{subtitle}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        {kicker ? <span className="eyebrow truncate">{kicker}</span> : <span />}
        {tags?.length ? <Badge>{tags[0]}</Badge> : null}
      </div>
    </Link>
  );
}
