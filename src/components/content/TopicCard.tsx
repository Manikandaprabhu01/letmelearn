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
  | "/examples/$slug"
  | "/playgrounds/$slug";

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
      className="group flex flex-col rounded-lg border border-border bg-surface p-4 transition-colors duration-150 hover:border-border-strong"
    >
      <div className="flex items-center justify-between gap-2">
        {kicker ? (
          <span className="text-[11px] uppercase tracking-[0.14em] text-accent">{kicker}</span>
        ) : (
          <span />
        )}
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full border",
            done ? "border-ok bg-ok/20 text-ok" : "border-border text-transparent",
          )}
          aria-hidden
        >
          <Check className="size-3" />
        </span>
      </div>
      <h3 className="mt-2 font-medium leading-snug text-fg group-hover:text-accent">{title}</h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm leading-6 text-muted">{subtitle}</p>
      {tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
