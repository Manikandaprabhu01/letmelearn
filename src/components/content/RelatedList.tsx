import { AppLink } from "@/lib/paths";
import { lookupPath } from "@/data/catalog";

export function RelatedList({ paths }: { paths: string[] }) {
  const items = paths.map(lookupPath).filter((x): x is NonNullable<typeof x> => Boolean(x));
  if (!items.length) return null;
  return (
    <div className="mt-12 border-t border-border pt-8">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">Continue</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <AppLink
            key={item.path}
            path={item.path}
            className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong"
          >
            <div className="text-[11px] uppercase tracking-[0.14em] text-accent">{item.kind}</div>
            <div className="mt-1 font-medium">{item.title}</div>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{item.subtitle}</p>
          </AppLink>
        ))}
      </div>
    </div>
  );
}
