import * as React from "react";
import { cn } from "@/lib/utils";

// Arcade field label: pixel, neon-cyan, uppercase.
export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "font-pixel uppercase tracking-wider text-[0.6rem] text-neon-cyan leading-none",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";
