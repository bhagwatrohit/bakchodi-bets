import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Arcade chip: neon border + glow, pixel type.
const badgeVariants = cva(
  "inline-flex items-center font-pixel uppercase tracking-wider text-[0.55rem] border-2 px-2 py-1",
  {
    variants: {
      variant: {
        default: "border-grid text-phosphor",
        primary: "border-neon-green text-neon-green shadow-[0_0_8px_rgba(57,255,20,0.5)]",
        accent: "border-neon-magenta text-neon-magenta shadow-[0_0_8px_rgba(255,43,214,0.5)]",
        success: "border-neon-green text-neon-green shadow-[0_0_8px_rgba(57,255,20,0.5)]",
        danger: "border-neon-pink text-neon-pink shadow-[0_0_8px_rgba(255,59,107,0.5)]",
        outline: "border-neon-cyan text-neon-cyan shadow-[0_0_8px_rgba(33,230,255,0.4)]",
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
