import * as React from "react";
import { cn } from "@/lib/utils";

// Newsprint field label: condensed all-caps kicker.
export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "font-condensed uppercase tracking-widest text-xs font-semibold text-ink-soft leading-none",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";
