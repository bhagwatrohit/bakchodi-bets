import * as React from "react";
import { cn } from "@/lib/utils";

// Newsprint form field: square, ink border, serif text.
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-11 w-full border-2 border-ink bg-paper px-3 py-2 text-base font-serif transition-colors placeholder:text-muted-foreground placeholder:italic focus-visible:outline-none focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
