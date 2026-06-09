import { cn } from "@/lib/utils";

export const DISCLAIMER_TEXT =
  "This app uses fictional credits only. Credits have no cash value, cannot be purchased, cannot be redeemed, and are used only for private entertainment within your group.";

/** Legal guardrail. `variant="footer"` for the site footer, `variant="inline"` for onboarding. */
export function Disclaimer({
  variant = "footer",
  className,
}: {
  variant?: "footer" | "inline";
  className?: string;
}) {
  if (variant === "inline") {
    return (
      <p
        className={cn(
          "rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground",
          className,
        )}
      >
        {DISCLAIMER_TEXT}
      </p>
    );
  }
  return (
    <footer className={cn("mt-auto border-t border-border bg-card", className)}>
      <div className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">No cash. Only bragging rights.</p>
        <p className="mt-1 mx-auto max-w-2xl">{DISCLAIMER_TEXT}</p>
      </div>
    </footer>
  );
}
