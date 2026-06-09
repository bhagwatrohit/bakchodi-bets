import { cn } from "@/lib/utils";

export const DISCLAIMER_TEXT =
  "This app uses fictional credits only. Credits have no cash value, cannot be purchased, cannot be redeemed, and are used only for private entertainment within your group.";

/** Legal guardrail, set as newspaper fine print. */
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
          "border-l-2 border-ink bg-muted px-3 py-2 text-xs italic text-ink-soft",
          className,
        )}
      >
        {DISCLAIMER_TEXT}
      </p>
    );
  }
  return (
    <footer className={cn("mt-auto border-t-2 border-ink bg-paper", className)}>
      <div className="mx-auto max-w-5xl px-4 py-5 text-center">
        <hr className="rule mx-auto mb-3 w-24" />
        <p className="kicker">No Cash · Only Bragging Rights</p>
        <p className="mx-auto mt-2 max-w-2xl text-xs italic text-ink-soft">
          {DISCLAIMER_TEXT}
        </p>
        <p className="dateline mt-3">
          © The Daily Degen · Printed on fictional paper · Est. 2026
        </p>
      </div>
    </footer>
  );
}
