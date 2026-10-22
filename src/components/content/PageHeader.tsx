import { MarkDone } from "@/components/content/MarkDone";
import { Badge } from "@/components/ui/badge";

/**
 * The top of every chapter, example and lab. One eyebrow, one large title, one
 * sentence, then metadata in mono — so the eye lands on the title first and the
 * chrome never competes with it.
 */
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
  // Four chips is the point where a row of metadata stops being scannable.
  const shown = tags?.slice(0, 4) ?? [];

  return (
    <header className="border-b border-border px-5 py-10 sm:px-8 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="eyebrow whitespace-nowrap">{kicker}</div>
        <MarkDone id={id} />
      </div>
      <h1 className="mt-4 max-w-[22ch] font-display text-[32px] leading-[1.08] sm:text-[40px]">
        {title}
      </h1>
      <p className="mt-4 max-w-[62ch] text-[16px] leading-7 text-muted">{subtitle}</p>
      {minutes || shown.length ? (
        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          {minutes ? <Badge tone="accent">{minutes} min read</Badge> : null}
          {shown.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      ) : null}
    </header>
  );
}
