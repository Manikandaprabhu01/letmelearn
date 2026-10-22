import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * One electric action per view.
 *
 * `primary` is the acid accent and should appear once on a screen — the thing
 * you want the reader to do next. Everything else is monochrome: `secondary`
 * for real but ordinary actions, `ghost` for tertiary, `outline` where a
 * control must read as a control without competing.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-cta text-cta-fg hover:brightness-110 active:scale-[0.98]",
        secondary:
          "bg-raised text-fg shadow-panel hover:bg-surface hover:shadow-[inset_0_0_0_1px_var(--color-border-strong)]",
        ghost: "text-muted hover:bg-raised hover:text-fg",
        outline: "text-fg shadow-panel hover:shadow-[inset_0_0_0_1px_var(--color-border-strong)]",
        danger: "bg-bad/15 text-bad hover:bg-bad/25",
      },
      size: {
        sm: "h-8 rounded-sm px-3 text-[13px]",
        md: "h-9 rounded-sm px-4 text-[13px]",
        lg: "h-11 rounded-sm px-5 text-[15px]",
        icon: "size-9 rounded-sm",
        "icon-sm": "size-8 rounded-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";
