import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BetForm } from "@/components/BetForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanContext } from "@/lib/services/clans";
import { getMatchDetail } from "@/lib/services/matches";
import { listAllBets } from "@/lib/services/bets";
import { format } from "@/lib/money";
import type { BetHistoryRow, MatchDetail, MatchStatus } from "@/lib/types";

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

function canBet(match: MatchDetail): boolean {
  if (match.status !== "open") return false;
  if (match.myBet) return false;
  if (match.clanLockAtStart && new Date(match.startsAt).getTime() <= Date.now())
    return false;
  return true;
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ clanId: string; matchId: string }>;
}) {
  const { clanId, matchId } = await params;

  const profile = await getSessionProfile();
  if (!profile)
    redirect(
      `/login?next=${encodeURIComponent(`/clans/${clanId}/matches/${matchId}`)}`,
    );

  const ctx = await getClanContext(clanId);
  if (!ctx) redirect("/dashboard");

  const match = await getMatchDetail(clanId, matchId);
  const status = STATUS_META[match.status];
  const showBetForm = canBet(match);
  const winningOutcome = match.winningOutcomeId
    ? match.outcomes.find((o) => o.id === match.winningOutcomeId)
    : null;

  // Optional all-bets table; the service enforces visibility. Skip silently if forbidden.
  let allBets: BetHistoryRow[] | null = null;
  try {
    allBets = await listAllBets(clanId, matchId);
  } catch {
    allBets = null;
  }

  return (
    <AppShell profile={profile}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Link
            href={`/clans/${clanId}/matches`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to matches
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-extrabold tracking-tight">
                {match.teamA} <span className="text-muted-foreground">vs</span>{" "}
                {match.teamB}
              </h1>
              {match.title !== `${match.teamA} vs ${match.teamB}` ? (
                <p className="text-sm text-muted-foreground">{match.title}</p>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {formatTime(match.startsAt)}
              </p>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-wrap gap-x-8 gap-y-2 py-5 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Max bet
              </p>
              <p className="font-semibold">{format(match.maxBet, match.currencyName)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Your balance
              </p>
              <p className="font-semibold">
                {format(match.availableBalance, match.currencyName)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Pot
              </p>
              <p className="font-semibold">{format(match.totalPot, match.currencyName)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Bets
              </p>
              <p className="font-semibold">{match.betCount}</p>
            </div>
          </CardContent>
        </Card>

        {match.status === "settled" && winningOutcome ? (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">Winning outcome</p>
              <Badge variant="success" className="w-fit text-sm">
                {winningOutcome.label}
              </Badge>
            </CardContent>
          </Card>
        ) : null}

        {match.myBet ? (
          <Card>
            <CardHeader>
              <CardTitle>Your bet</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Pick
                  </p>
                  <p className="font-semibold">{match.myBet.outcomeLabel}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Stake
                  </p>
                  <p className="font-semibold">
                    {format(match.myBet.stake, match.currencyName)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Status
                  </p>
                  <Badge variant={BET_STATUS_META[match.myBet.status].variant}>
                    {BET_STATUS_META[match.myBet.status].label}
                  </Badge>
                </div>
                {match.myBet.status !== "pending" ? (
                  <>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Payout
                      </p>
                      <p className="font-semibold">
                        {format(match.myBet.payout, match.currencyName)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Profit
                      </p>
                      <p className="font-semibold">
                        {format(match.myBet.profit, match.currencyName)}
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {showBetForm ? (
          <Card>
            <CardHeader>
              <CardTitle>Place your fake-money bet</CardTitle>
            </CardHeader>
            <CardContent>
              <BetForm
                clanId={clanId}
                matchId={matchId}
                outcomes={match.outcomes}
                maxBet={match.maxBet}
                availableBalance={match.availableBalance}
                currencyName={match.currencyName}
              />
            </CardContent>
          </Card>
        ) : !match.myBet && match.status === "open" ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Betting has closed for this match.
            </CardContent>
          </Card>
        ) : null}

        {allBets && allBets.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>All bets</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Who</TableHead>
                    <TableHead>Pick</TableHead>
                    <TableHead>Stake</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allBets.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.displayName}</TableCell>
                      <TableCell>{b.pick}</TableCell>
                      <TableCell>{format(b.stake, match.currencyName)}</TableCell>
                      <TableCell>
                        <Badge variant={BET_STATUS_META[b.status].variant}>
                          {BET_STATUS_META[b.status].label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        {match.myBet ? (
          <div>
            <Link href={`/clans/${clanId}/matches`}>
              <Button variant="outline">Back to matches</Button>
            </Link>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
