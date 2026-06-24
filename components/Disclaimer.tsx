import { cn } from "@/lib/utils";

export const DISCLAIMER_TEXT =
  "This app uses fictional credits only. Credits have no cash value, cannot be purchased, cannot be redeemed, and are used only for private entertainment within your group.";

/** Legal guardrail shown in the footer and inline. */
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
          "rounded-md border border-border bg-muted px-3 py-2 text-base text-muted-foreground",
          className,
        )}
      >
        {DISCLAIMER_TEXT}
      </p>
    );
  }
  return (
    <footer className={cn("mt-auto border-t border-border bg-bg-2/60", className)}>
      <div className="mx-auto max-w-5xl px-4 py-5 text-center">
        <p className="kicker text-[var(--accent-amber)]">No cash · only bragging rights</p>
        <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">{DISCLAIMER_TEXT}</p>
        <p className="dateline mt-3">© Bakchodi Bets · For fun only · Est. 2026</p>
      </div>
    </footer>
  );
}
