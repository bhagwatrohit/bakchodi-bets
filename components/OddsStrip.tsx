import { cn } from "@/lib/utils";
import type { MatchOddsView } from "@/lib/types";

/*
  Bookmaker odds, shown wherever a match appears. Pure presentational —
  safe to render from server pages and client components alike.
*/

/** Amber "Vegas says" strip with the moneylines for one fixture. */
export function OddsStrip({
  teamA,
  teamB,
  odds,
  className,
}: {
  teamA: string;
  teamB: string;
  odds: MatchOddsView;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border-l-2 border-[var(--accent-amber)] bg-muted px-3 py-2 text-xs",
        className,
      )}
    >
      <span className="kicker text-[var(--accent-amber)]">Vegas says</span>
      {odds.a && odds.b ? (
        <span className="tabular text-foreground">
          {teamA} {odds.a}
          {odds.draw ? ` · Draw ${odds.draw}` : ""} · {teamB} {odds.b}
        </span>
      ) : (
        <span className="tabular text-foreground">{odds.summary}</span>
      )}
      {odds.provider ? <span className="dateline">via {odds.provider}</span> : null}
    </div>
  );
}

/**
 * One-line decoder for American moneylines. `full` adds the reminder that
 * clan payouts still come from the pot, not from these lines.
 */
export function OddsExplainer({
  full = false,
  className,
}: {
  full?: boolean;
  className?: string;
}) {
  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
      Reading the lines: <span className="tabular">minus</span> = favorite (stake
      that much to win 100), <span className="tabular">plus</span> = underdog
      (a 100 stake wins that much).
      {full ? (
        <>
          {" "}
          They&apos;re intel only — payouts here still split the clan pot, not
          the bookie&apos;s odds.
        </>
      ) : null}
    </p>
  );
}
