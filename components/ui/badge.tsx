import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Clean chip: rounded, hairline or tinted, no glow.
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-border text-muted-foreground",
        primary: "border-transparent bg-primary/15 text-primary",
        accent: "border-transparent bg-accent/15 text-accent",
        success: "border-transparent bg-success/15 text-success",
        danger: "border-transparent bg-danger/15 text-danger",
        outline: "border-border text-foreground",
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
