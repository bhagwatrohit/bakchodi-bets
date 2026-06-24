import Link from "next/link";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";
import { OddsStrip } from "@/components/OddsStrip";
import { Button } from "@/components/ui/button";
import { format } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { MatchListItem, MatchOddsView, MatchStatus } from "@/lib/types";

const STATUS_META: Record<MatchStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "text-primary" },
  locked: { label: "Live", className: "text-[var(--accent-amber)]" },
  final: { label: "Final", className: "text-muted-foreground" },
  settled: { label: "Settled", className: "text-muted-foreground" },
};

const BET_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  won: "Won",
  lost: "Lost",
  void: "Void",
};

/** One compact match in the browse list. `isNext` lights up the soonest game. */
export function MatchRow({
  match,
  clanId,
  currencyName,
  isNext = false,
  odds,
}: {
  match: MatchListItem;
  clanId: string;
  currencyName: string;
  isNext?: boolean;
  odds?: MatchOddsView;
}) {
  const href = `/clans/${clanId}/matches/${match.id}`;
  const status = STATUS_META[match.displayStatus];
  const canBet = match.displayStatus === "open";
  const hasBet = match.myBet != null;
  const ctaLabel = !canBet ? "View" : hasBet ? "Edit pick" : "Place bet";
  const ctaVariant = canBet && !hasBet ? "primary" : "outline";

  const context = match.round ?? (match.groupLabel ? `Group ${match.groupLabel}` : null);

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 sm:p-4",
        isNext ? "border-primary ring-1 ring-primary/40" : "border-border",
      )}
    >
      <div className="flex items-stretch gap-3 sm:gap-4">
        {/* kickoff */}
        <div className="flex w-14 shrink-0 flex-col items-center justify-center text-center sm:w-16">
          <LocalTime
            value={match.startsAt}
            dateStyle={undefined}
            timeStyle="short"
            className="tabular text-sm font-semibold sm:text-base"
          />
          <LocalTime
            value={match.startsAt}
            dateStyle="medium"
            timeStyle={undefined}
            className="dateline mt-0.5 text-[0.68rem] leading-tight"
          />
        </div>

        {/* teams + meta */}
        <div className="min-w-0 flex-1">
          {isNext ? (
            <span className="mb-1 inline-block rounded bg-primary/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-primary">
              Next up
            </span>
          ) : null}
          <div className="matchup flex flex-col gap-1 text-base sm:text-lg">
            <span className="flex items-center gap-2">
              <Flag team={match.teamA} size="sm" />
              <span className="min-w-0 truncate">{match.teamA}</span>
            </span>
            <span className="flex items-center gap-2">
              <Flag team={match.teamB} size="sm" />
              <span className="min-w-0 truncate">{match.teamB}</span>
            </span>
          </div>
          <p className="dateline mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs">
            {context ? <span>{context}</span> : null}
            <span>
              Min <span className="tabular">{format(match.minBet, currencyName)}</span> · Max{" "}
              <span className="tabular">{format(match.maxBet, currencyName)}</span>
            </span>
            <span>
              Pot <span className="tabular">{format(match.totalPot, currencyName)}</span>
            </span>
          </p>
          {match.myBet ? (
            <p className="mt-1.5 text-xs">
              <span className="text-muted-foreground">Your pick: </span>
              <span className="font-semibold text-foreground">{match.myBet.outcomeLabel}</span>{" "}
              <span className="tabular text-muted-foreground">
                ({format(match.myBet.stake, currencyName)})
              </span>
              <span className="ml-1 text-muted-foreground">
                · {BET_STATUS_LABEL[match.myBet.status]}
              </span>
            </p>
          ) : null}
        </div>

        {/* status + CTA */}
        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
          <span className={cn("text-xs font-semibold uppercase tracking-wide", status.className)}>
            {status.label}
          </span>
          <Link href={href}>
            <Button variant={ctaVariant} size="sm">
              {ctaLabel}
            </Button>
          </Link>
        </div>
      </div>

      {odds ? (
        <OddsStrip teamA={match.teamA} teamB={match.teamB} odds={odds} className="mt-3" />
      ) : null}
    </div>
  );
}
