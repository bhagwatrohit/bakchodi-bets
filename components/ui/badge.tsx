import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Newsprint label / ink stamp.
const badgeVariants = cva(
  "inline-flex items-center font-condensed uppercase tracking-widest text-[0.65rem] font-semibold border px-2 py-0.5",
  {
    variants: {
      variant: {
        default: "border-ink bg-paper text-ink",
        primary: "border-ink bg-ink text-paper",
        accent: "border-accent bg-accent text-paper",
        success: "border-success text-success bg-paper",
        danger: "border-danger text-danger bg-paper",
        outline: "border-ink text-ink bg-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
