import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BetForm } from "@/components/BetForm";
import { Flag } from "@/components/Flag";
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

/** Betting/editing window: open, and not past lock. Existing pick can still be changed. */
function bettable(match: MatchDetail): boolean {
  if (match.status !== "open") return false;
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
  const status = STATUS_META[match.displayStatus];
  const showBetForm = bettable(match);
  const isGala = match.marketType === "tournament_winner";
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
            className="dateline hover:text-neon-cyan"
          >
            « MATCH SELECT
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-grid pb-3">
            <div className="flex flex-col gap-1">
              {isGala ? (
                <>
                  <p className="kicker text-neon-amber">🏆 Grand Gala</p>
                  <h1 className="headline text-2xl sm:text-4xl">World Cup Winner</h1>
                  <p className="dateline mt-1">
                    Pick the champion · entry closes when the knockouts begin
                  </p>
                </>
              ) : (
                <>
                  <p className="kicker">MATCH</p>
                  <h1 className="matchup flex flex-col gap-2 text-3xl sm:text-5xl">
                    <span className="flex items-center gap-3">
                      <Flag team={match.teamA} size="lg" />
                      <span className="min-w-0">{match.teamA}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-pixel text-xs text-neon-magenta glow-magenta">vs</span>
                      <Flag team={match.teamB} size="lg" />
                      <span className="min-w-0">{match.teamB}</span>
                    </span>
                  </h1>
                  {match.title !== `${match.teamA} vs ${match.teamB}` ? (
                    <p className="dateline">{match.title}</p>
                  ) : null}
                  <p className="dateline mt-1">{formatTime(match.startsAt)}</p>
                </>
              )}
            </div>
            <span className={`stamp ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        <Card>
          <CardContent className="grid grid-cols-2 gap-y-3 py-5 sm:grid-cols-4 sm:divide-x sm:divide-grid">
            <div className="sm:px-4 sm:first:pl-0">
              <p className="kicker">{isGala ? "Entry" : "Max Bet"}</p>
              <p className="tabular text-lg font-semibold">
                {format(isGala ? (match.fixedStake ?? "0") : match.maxBet, match.currencyName)}
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
              <p className="kicker">Bets</p>
              <p className="tabular text-lg font-semibold">{match.betCount}</p>
            </div>
          </CardContent>
        </Card>

        {match.status === "settled" && winningOutcome ? (
          <Card className="border-2 border-neon-green">
            <CardHeader>
              <p className="kicker">FINAL SCORE</p>
              <CardTitle className="headline text-2xl">GAME OVER</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="kicker">Winning Outcome</p>
              <span className="stamp w-fit text-neon-green text-base">
                {winningOutcome.label}
              </span>
            </CardContent>
          </Card>
        ) : null}

        {match.myBet && !showBetForm ? (
          <Card className="border-2 border-dashed border-neon-cyan bg-card">
            <CardHeader>
              <p className="kicker">SAVED</p>
              <CardTitle className="headline text-2xl">YOUR BET</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <hr className="rule-hair" />
              <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
                <div>
                  <p className="kicker">Pick</p>
                  <p className="flex items-center gap-2 font-semibold">
                    {match.myBet.outcomeLabel !== "Draw" ? (
                      <Flag team={match.myBet.outcomeLabel} size="sm" />
                    ) : null}
                    {match.myBet.outcomeLabel}
                  </p>
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
              <p className="kicker">
                {match.myBet ? "CHANGE IT UP" : isGala ? "ENTER THE POOL" : "MAKE YOUR PICK"}
              </p>
              <CardTitle className="headline text-2xl">
                {match.myBet ? "EDIT YOUR PICK" : isGala ? "GRAND GALA" : "PLACE YOUR BET"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BetForm
                clanId={clanId}
                matchId={matchId}
                outcomes={match.outcomes}
                maxBet={match.maxBet}
                availableBalance={match.availableBalance}
                currencyName={match.currencyName}
                marketType={match.marketType}
                fixedStake={match.fixedStake}
                existingBet={
                  match.myBet
                    ? { outcomeId: match.myBet.outcomeId, stake: match.myBet.stake }
                    : null
                }
              />
            </CardContent>
          </Card>
        ) : !match.myBet && match.status === "open" ? (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="kicker text-neon-amber">Lines Closed</p>
              <p className="mt-1 dateline">
                The book is shut on this match.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {allBets && allBets.length > 0 ? (
          <Card>
            <CardHeader>
              <p className="kicker">ON THE RECORD</p>
              <CardTitle className="headline text-2xl">ALL BETS</CardTitle>
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
                      <TableCell>
                        <span className="flex items-center gap-2">
                          {b.pick !== "Draw" ? (
                            <Flag team={b.pick} size="sm" />
                          ) : null}
                          {b.pick}
                        </span>
                      </TableCell>
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
              <Button variant="outline">« MATCH SELECT</Button>
            </Link>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
