import { cn } from "@/lib/utils";

export const DISCLAIMER_TEXT =
  "This app uses fictional credits only. Credits have no cash value, cannot be purchased, cannot be redeemed, and are used only for private entertainment within your group.";

/** Legal guardrail, arcade marquee style. */
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
          "border-2 border-grid bg-muted px-3 py-2 text-base text-muted-foreground",
          className,
        )}
      >
        {DISCLAIMER_TEXT}
      </p>
    );
  }
  return (
    <footer className={cn("mt-auto border-t-2 border-grid bg-bg-2/60", className)}>
      <div className="mx-auto max-w-5xl px-4 py-5 text-center">
        <p className="font-pixel text-[0.6rem] uppercase text-neon-amber glow-amber">
          No Cash · Only Bragging Rights
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">{DISCLAIMER_TEXT}</p>
        <p className="dateline mt-3">© Bakchodi Bets · Fictional Arcade · Est. 2026</p>
      </div>
    </footer>
  );
}
