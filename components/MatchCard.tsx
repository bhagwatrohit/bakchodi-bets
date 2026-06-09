import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "@/lib/money";
import type { MatchListItem, MatchStatus } from "@/lib/types";

const STATUS_META: Record<
  MatchStatus,
  { label: string; variant: "success" | "default" | "accent" | "outline" }
> = {
  open: { label: "Open", variant: "success" },
  locked: { label: "Locked", variant: "default" },
  final: { label: "Final", variant: "accent" },
  settled: { label: "Settled", variant: "outline" },
};

const BET_STATUS_META: Record<
  string,
  { label: string; variant: "default" | "success" | "danger" | "outline" }
> = {
  pending: { label: "Pending", variant: "default" },
  won: { label: "Won", variant: "success" },
  lost: { label: "Lost", variant: "danger" },
  void: { label: "Void", variant: "outline" },
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

  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-bold leading-tight">
              {match.teamA} <span className="text-muted-foreground">vs</span> {match.teamB}
            </span>
            {match.title !== `${match.teamA} vs ${match.teamB}` ? (
              <span className="text-xs text-muted-foreground">{match.title}</span>
            ) : null}
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{formatTime(match.startsAt)}</p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            Max bet:{" "}
            <span className="font-semibold text-foreground">
              {format(match.maxBet, currencyName)}
            </span>
          </span>
          <span>
            Pot:{" "}
            <span className="font-semibold text-foreground">
              {format(match.totalPot, currencyName)}
            </span>
          </span>
          <span>
            {match.betCount} {match.betCount === 1 ? "bet" : "bets"}
          </span>
        </div>

        {match.myBet ? (
          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
            <span>
              Your bet:{" "}
              <span className="font-semibold">{match.myBet.outcomeLabel}</span>{" "}
              <span className="text-muted-foreground">
                ({format(match.myBet.stake, currencyName)})
              </span>
            </span>
            <Badge variant={BET_STATUS_META[match.myBet.status].variant}>
              {BET_STATUS_META[match.myBet.status].label}
            </Badge>
          </div>
        ) : null}

        <div className="mt-auto pt-1">
          <Link href={href} className="block">
            <Button
              variant={match.status === "open" && !match.myBet ? "primary" : "outline"}
              className="w-full"
            >
              {match.status === "open" && !match.myBet ? "Place bet" : "View"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
