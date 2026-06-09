import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BetForm } from "@/components/BetForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="flex flex-col gap-3">
          <Link
            href={`/clans/${clanId}/matches`}
            className="dateline hover:text-accent"
          >
            ← Back to the Card
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-ink pb-3">
            <div className="flex flex-col gap-1">
              <p className="kicker text-accent">Match Report</p>
              <h1 className="headline text-3xl sm:text-5xl leading-tight">
                {match.teamA} <span className="text-ink-soft font-normal">v</span>{" "}
                {match.teamB}
              </h1>
              {match.title !== `${match.teamA} vs ${match.teamB}` ? (
                <p className="text-sm italic text-ink-soft">{match.title}</p>
              ) : null}
              <p className="dateline mt-1">{formatTime(match.startsAt)}</p>
            </div>
            <span className={`stamp stamp-rotated ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        <Card>
          <CardContent className="grid grid-cols-2 gap-y-3 py-5 sm:grid-cols-4 sm:divide-x sm:divide-hairline">
            <div className="sm:px-4 sm:first:pl-0">
              <p className="kicker">Max Bet</p>
              <p className="tabular text-lg font-semibold">
                {format(match.maxBet, match.currencyName)}
              </p>
            </div>
            <div className="sm:px-4">
              <p className="kicker">Your Balance</p>
              <p className="tabular text-lg font-semibold">
                {format(match.availableBalance, match.currencyName)}
              </p>
            </div>
            <div className="sm:px-4">
              <p className="kicker">Pot</p>
              <p className="tabular text-lg font-semibold">
                {format(match.totalPot, match.currencyName)}
              </p>
            </div>
            <div className="sm:px-4">
              <p className="kicker">Wagers</p>
              <p className="tabular text-lg font-semibold">{match.betCount}</p>
            </div>
          </CardContent>
        </Card>

        {match.status === "settled" && winningOutcome ? (
          <Card className="border-2 border-ink">
            <CardHeader>
              <p className="kicker text-accent">Final Whistle</p>
              <CardTitle className="headline text-2xl">The Result Is In</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="kicker">Winning Outcome</p>
              <span className="stamp stamp-rotated w-fit text-success text-base">
                {winningOutcome.label}
              </span>
            </CardContent>
          </Card>
        ) : null}

        {match.myBet ? (
          <Card className="border-2 border-dashed border-ink bg-paper-2">
            <CardHeader>
              <p className="kicker text-accent">Coupon Stub · Retained</p>
              <CardTitle className="headline text-2xl">Your Bet</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <hr className="rule-hair" />
              <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
                <div>
                  <p className="kicker">Pick</p>
                  <p className="font-semibold">{match.myBet.outcomeLabel}</p>
                </div>
                <div>
                  <p className="kicker">Stake</p>
                  <p className="tabular font-semibold">
                    {format(match.myBet.stake, match.currencyName)}
                  </p>
                </div>
                <div>
                  <p className="kicker">Status</p>
                  <span
                    className={`stamp text-xs ${BET_STATUS_META[match.myBet.status].color}`}
                  >
                    {BET_STATUS_META[match.myBet.status].label}
                  </span>
                </div>
                {match.myBet.status !== "pending" ? (
                  <>
                    <div>
                      <p className="kicker">Payout</p>
                      <p className="tabular font-semibold">
                        {format(match.myBet.payout, match.currencyName)}
                      </p>
                    </div>
                    <div>
                      <p className="kicker">Profit</p>
                      <p className="tabular font-semibold">
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
              <p className="kicker text-accent">Wager Coupon</p>
              <CardTitle className="headline text-2xl">Place Your Wager</CardTitle>
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
            <CardContent className="py-6 text-center">
              <p className="kicker">Lines Closed</p>
              <p className="mt-1 font-serif italic text-ink-soft">
                The book is shut on this fixture.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {allBets && allBets.length > 0 ? (
          <Card>
            <CardHeader>
              <p className="kicker text-accent">On The Record</p>
              <CardTitle className="headline text-2xl">The Wagers</CardTitle>
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
                      <TableCell className="tabular">
                        {format(b.stake, match.currencyName)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`stamp text-xs ${BET_STATUS_META[b.status].color}`}
                        >
                          {BET_STATUS_META[b.status].label}
                        </span>
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
              <Button variant="outline">Back to the Card</Button>
            </Link>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
