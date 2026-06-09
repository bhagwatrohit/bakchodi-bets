import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Arcade buttons: square, neon border + glow, terminal type, press feel.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-condensed uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 cursor-pointer border-2 active:translate-y-0.5",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground border-neon-green shadow-[0_0_14px_rgba(57,255,20,0.5)] hover:shadow-[0_0_22px_rgba(57,255,20,0.85)]",
        accent:
          "bg-accent text-accent-foreground border-neon-magenta shadow-[0_0_14px_rgba(255,43,214,0.5)] hover:shadow-[0_0_22px_rgba(255,43,214,0.85)]",
        outline:
          "bg-transparent text-neon-cyan border-neon-cyan shadow-[0_0_10px_rgba(33,230,255,0.35)] hover:bg-neon-cyan hover:text-background",
        ghost: "border-transparent text-phosphor hover:bg-muted",
        danger:
          "bg-danger text-danger-foreground border-neon-pink shadow-[0_0_14px_rgba(255,59,107,0.5)] hover:shadow-[0_0_22px_rgba(255,59,107,0.85)]",
        success:
          "bg-success text-success-foreground border-neon-green shadow-[0_0_14px_rgba(57,255,20,0.5)] hover:shadow-[0_0_22px_rgba(57,255,20,0.85)]",
        link: "border-transparent text-neon-cyan underline underline-offset-4 decoration-2 hover:glow-cyan",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-base",
        lg: "h-13 px-7 text-lg",
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
