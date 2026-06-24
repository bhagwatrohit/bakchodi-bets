import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Clean fintech buttons: rounded, solid accent or subtle surface, no glow.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 cursor-pointer border",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground border-transparent hover:opacity-90",
        accent: "bg-accent text-accent-foreground border-transparent hover:opacity-90",
        outline: "bg-transparent text-foreground border-border hover:bg-muted",
        ghost: "border-transparent text-foreground hover:bg-muted",
        danger: "bg-danger text-danger-foreground border-transparent hover:opacity-90",
        success: "bg-success text-success-foreground border-transparent hover:opacity-90",
        link: "border-transparent text-primary underline underline-offset-4 hover:opacity-80",
      },
      size: {
        sm: "h-9 px-3 text-sm",
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
