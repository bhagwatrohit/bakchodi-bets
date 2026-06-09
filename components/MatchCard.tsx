import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "@/lib/money";
import type { MatchListItem, MatchStatus } from "@/lib/types";

// Status as an ink stamp; color via text-*.
const STATUS_META: Record<MatchStatus, { label: string; color: string }> = {
  open: { label: "Open", color: "text-accent" },
  locked: { label: "Locked", color: "text-ink" },
  final: { label: "Final", color: "text-ink" },
  settled: { label: "Settled", color: "text-ink-soft" },
};

const BET_STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-ink-soft" },
  won: { label: "Won", color: "text-success" },
  lost: { label: "Lost", color: "text-danger" },
  void: { label: "Void", color: "text-ink-soft" },
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
}: {
  match: MatchListItem;
  clanId: string;
  currencyName: string;
}) {
  const status = STATUS_META[match.status];
  const href = `/clans/${clanId}/matches/${match.id}`;

  const myBetStatus = match.myBet ? BET_STATUS_META[match.myBet.status] : null;

  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <p className="dateline">{formatTime(match.startsAt)}</p>
          <span className={`stamp text-xs ${status.color}`}>{status.label}</span>
        </div>
        <h3 className="headline text-xl leading-tight">
          {match.teamA} <span className="text-ink-soft font-normal">v</span>{" "}
          {match.teamB}
        </h3>
        {match.title !== `${match.teamA} vs ${match.teamB}` ? (
          <p className="text-xs italic text-ink-soft">{match.title}</p>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <hr className="rule-hair" />
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
          <span className="kicker">
            Max{" "}
            <span className="tabular text-ink">{format(match.maxBet, currencyName)}</span>
          </span>
          <span className="kicker">
            Pot{" "}
            <span className="tabular text-ink">{format(match.totalPot, currencyName)}</span>
          </span>
          <span className="kicker">
            <span className="tabular text-ink">{match.betCount}</span>{" "}
            {match.betCount === 1 ? "Wager" : "Wagers"}
          </span>
        </div>

        {match.myBet && myBetStatus ? (
          <div className="flex items-center justify-between border-l-2 border-ink bg-muted px-3 py-2 text-sm">
            <span>
              <span className="kicker">Your call · </span>
              <span className="font-semibold">{match.myBet.outcomeLabel}</span>{" "}
              <span className="tabular text-ink-soft">
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
              variant={match.status === "open" && !match.myBet ? "primary" : "outline"}
              className="w-full"
            >
              {match.status === "open" && !match.myBet
                ? "Place a Wager"
                : "Read the Report"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
