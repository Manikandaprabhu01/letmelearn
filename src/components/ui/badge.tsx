import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Metadata, not decoration: mono, small, 4px radius, hairline or tinted. */
const badgeVariants = cva(
  "inline-flex items-center rounded-xs px-1.5 py-0.5 font-mono text-[11px] leading-4 tracking-[0.02em] whitespace-nowrap",
  {
    variants: {
      tone: {
        muted: "bg-raised text-muted shadow-panel",
        accent: "bg-fg/10 text-accent",
        ok: "bg-ok/15 text-ok",
        warn: "bg-warn/15 text-warn",
        bad: "bg-bad/15 text-bad",
      },
    },
    defaultVariants: { tone: "muted" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
