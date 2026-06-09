import * as React from "react";
import { cn } from "@/lib/utils";

// Arcade input: square, neon-cyan border, terminal type, glow on focus.
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-11 w-full border-2 border-grid bg-background px-3 py-2 text-lg font-condensed text-phosphor transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-neon-cyan focus-visible:shadow-[0_0_12px_rgba(33,230,255,0.4)] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
