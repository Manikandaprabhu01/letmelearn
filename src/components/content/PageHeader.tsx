import { Badge } from "@/components/ui/badge";
import { MarkDone } from "@/components/content/MarkDone";

export function PageHeader({
  kicker,
  title,
  subtitle,
  minutes,
  tags,
  id,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  minutes?: number;
  tags?: string[];
  id: string;
}) {
  return (
    <header className="border-b border-border px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
          {kicker}
        </div>
        <MarkDone id={id} />
      </div>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">{subtitle}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {minutes ? <Badge>{minutes} min</Badge> : null}
        {tags?.map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
      </div>
    </header>
  );
}
