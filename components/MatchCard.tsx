import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flag } from "@/components/Flag";
import { format } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { MatchListItem, MatchOddsView, MatchStatus } from "@/lib/types";

// Status as a neon stamp; color via text-*.
const STATUS_META: Record<MatchStatus, { label: string; color: string }> = {
  open: { label: "OPEN", color: "text-neon-green" },
  locked: { label: "LOCKED", color: "text-neon-amber" },
  final: { label: "FINAL", color: "text-neon-cyan" },
  settled: { label: "SETTLED", color: "text-muted-foreground" },
};

const BET_STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "PENDING", color: "text-muted-foreground" },
  won: { label: "WON", color: "text-neon-green" },
  lost: { label: "LOST", color: "text-neon-pink" },
  void: { label: "VOID", color: "text-muted-foreground" },
};

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function MatchCard({
  match,
  clanId,
  currencyName,
  odds,
}: {
  match: MatchListItem;
  clanId: string;
  currencyName: string;
  /** Bookmaker lines for this fixture (informational), when available. */
  odds?: MatchOddsView | null;
}) {
  const status = STATUS_META[match.displayStatus];
  const href = `/clans/${clanId}/matches/${match.id}`;
  const canBet = match.displayStatus === "open" && !match.myBet;
  const isGala = match.marketType === "tournament_winner";

  const myBetStatus = match.myBet ? BET_STATUS_META[match.myBet.status] : null;

  return (
    <Card className={cn("flex flex-col", isGala && "border-neon-amber")}>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <p className="dateline">
            {isGala ? "Open until the knockouts" : formatTime(match.startsAt)}
          </p>
          <span className={`stamp text-xs ${status.color}`}>{status.label}</span>
        </div>
        {isGala ? (
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="kicker text-neon-amber">Grand Gala</p>
              <h3 className="headline text-lg sm:text-xl">World Cup Winner</h3>
            </div>
          </div>
        ) : (
          <>
            <h3 className="matchup flex flex-col gap-1.5 text-2xl sm:text-3xl">
              <span className="flex items-center gap-2">
                <Flag team={match.teamA} size="md" />
                <span className="min-w-0">{match.teamA}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-pixel text-[0.6rem] text-neon-magenta glow-magenta">vs</span>
                <Flag team={match.teamB} size="md" />
                <span className="min-w-0">{match.teamB}</span>
              </span>
            </h3>
            {match.title !== `${match.teamA} vs ${match.teamB}` ? (
              <p className="dateline">{match.title}</p>
            ) : null}
          </>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <hr className="rule-hair" />
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="kicker">
            {isGala ? "Entry" : "Max"}{" "}
            <span className="tabular text-phosphor">
              {format(isGala ? (match.fixedStake ?? "0") : match.maxBet, currencyName)}
            </span>
          </span>
          <span className="kicker">
            Pot{" "}
            <span className="tabular text-phosphor">{format(match.totalPot, currencyName)}</span>
          </span>
          <span className="kicker">
            <span className="tabular text-phosphor">{match.betCount}</span>{" "}
            {isGala ? (match.betCount === 1 ? "Entry" : "Entries") : match.betCount === 1 ? "Bet" : "Bets"}
          </span>
        </div>

        {odds && !isGala ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-l-2 border-neon-amber bg-muted px-3 py-2 text-xs">
            <span className="kicker text-neon-amber">Vegas says</span>
            {odds.a && odds.b ? (
              <span className="tabular text-phosphor">
                {match.teamA} {odds.a}
                {odds.draw ? ` · Draw ${odds.draw}` : ""} · {match.teamB} {odds.b}
              </span>
            ) : (
              <span className="tabular text-phosphor">{odds.summary}</span>
            )}
            {odds.provider ? (
              <span className="dateline">via {odds.provider}</span>
            ) : null}
          </div>
        ) : null}

        {match.myBet && myBetStatus ? (
          <div className="flex items-center justify-between border-l-2 border-neon-cyan bg-muted px-3 py-2 text-sm">
            <span>
              <span className="kicker">Your pick · </span>
              <span className="font-semibold text-phosphor">{match.myBet.outcomeLabel}</span>{" "}
              <span className="tabular text-muted-foreground">
                ({format(match.myBet.stake, currencyName)})
              </span>
            </span>
            <span className={`stamp text-xs ${myBetStatus.color}`}>
              {myBetStatus.label}
            </span>
          </div>
        ) : null}

        <div className="mt-auto pt-1">
          <Link href={href} className="block">
            <Button
              variant={canBet ? (isGala ? "accent" : "primary") : "outline"}
              className="w-full"
            >
              {canBet ? (isGala ? "ENTER THE GALA" : "BET NOW") : "VIEW"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
