import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Newsprint buttons: square, condensed all-caps, ink-stamp feel.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-condensed uppercase tracking-widest font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-40 cursor-pointer border-2 active:translate-y-px",
  {
    variants: {
      variant: {
        primary: "bg-ink text-paper border-ink hover:bg-paper hover:text-ink",
        accent: "bg-accent text-paper border-accent hover:bg-paper hover:text-accent",
        outline: "bg-paper text-ink border-ink hover:bg-ink hover:text-paper",
        ghost: "border-transparent text-ink hover:bg-muted",
        danger: "bg-danger text-paper border-danger hover:bg-paper hover:text-danger",
        success: "bg-success text-paper border-success hover:bg-paper hover:text-success",
        link: "border-transparent text-ink underline underline-offset-4 decoration-2 hover:text-accent",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
