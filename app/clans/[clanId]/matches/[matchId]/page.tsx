import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ClanNav } from "@/components/ClanNav";
import { BetForm } from "@/components/BetForm";
import { SettleMatchForm } from "@/components/admin/SettleMatchForm";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";
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
import { OddsExplainer, OddsStrip } from "@/components/OddsStrip";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanContext } from "@/lib/services/clans";
import { getMatchDetail } from "@/lib/services/matches";
import { getWorldCupOdds, oddsViewFor } from "@/lib/services/worldcup-feed";
import { listAllBets } from "@/lib/services/bets";
import { format } from "@/lib/money";
import type { BetHistoryRow, MatchDetail, MatchStatus } from "@/lib/types";

const STATUS_META: Record<MatchStatus, { label: string; color: string }> = {
  open: { label: "Open", color: "text-primary" },
  locked: { label: "Live", color: "text-[var(--accent-amber)]" },
  final: { label: "Final", color: "text-muted-foreground" },
  settled: { label: "Settled", color: "text-muted-foreground" },
};

const BET_STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-muted-foreground" },
  won: { label: "Won", color: "text-primary" },
  lost: { label: "Lost", color: "text-danger" },
  void: { label: "Void", color: "text-muted-foreground" },
};

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
  const isAdmin = ctx.membership.role === "admin";
  const winningOutcome = match.winningOutcomeId
    ? match.outcomes.find((o) => o.id === match.winningOutcomeId)
    : null;

  // Bookmaker lines for this fixture (best-effort; absent when feed is down).
  let odds = null;
  if (!isGala && match.status !== "settled") {
    const oddsEntries = await getWorldCupOdds();
    odds = oddsEntries ? oddsViewFor(oddsEntries, match.teamA, match.teamB) : null;
  }

  // Optional all-bets table; the service enforces visibility. Skip silently if forbidden.
  let allBets: BetHistoryRow[] | null = null;
  try {
    allBets = await listAllBets(clanId, matchId);
  } catch {
    allBets = null;
  }

  return (
    <AppShell profile={profile}>
      <ClanNav clanId={clanId} clanName={ctx.clan.name} isAdmin={isAdmin} />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Link
            href={`/clans/${clanId}/matches`}
            className="dateline hover:text-foreground"
          >
            ← Matches
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div className="flex flex-col gap-1">
              {isGala ? (
                <>
                  <p className="kicker">🏆 Grand Gala</p>
                  <h1 className="headline text-2xl sm:text-4xl">World Cup Winner</h1>
                  <p className="dateline mt-1">
                    Pick the champion · entry closes when the knockouts begin
                  </p>
                </>
              ) : (
                <>
                  {match.round ? (
                    <p className="kicker">{match.round}</p>
                  ) : match.groupLabel ? (
                    <p className="kicker">Group {match.groupLabel}</p>
                  ) : (
                    <p className="kicker">Match</p>
                  )}
                  <h1 className="matchup flex flex-col gap-2 text-2xl sm:text-4xl">
                    <span className="flex items-center gap-3">
                      <Flag team={match.teamA} size="lg" />
                      <span className="min-w-0">{match.teamA}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">vs</span>
                      <Flag team={match.teamB} size="lg" />
                      <span className="min-w-0">{match.teamB}</span>
                    </span>
                  </h1>
                  {match.title !== `${match.teamA} vs ${match.teamB}` ? (
                    <p className="dateline">{match.title}</p>
                  ) : null}
                  <LocalTime value={match.startsAt} className="dateline mt-1" />
                </>
              )}
            </div>
            <span className={`stamp ${status.color}`}>{status.label}</span>
          </div>
        </div>

        <Card>
          <CardContent className="grid grid-cols-2 gap-y-3 py-5 sm:grid-cols-4 sm:divide-x sm:divide-border">
            <div className="sm:px-4 sm:first:pl-0">
              <p className="kicker">{isGala ? "Entry" : "Bet range"}</p>
              <p className="tabular text-lg font-semibold">
                {isGala
                  ? format(match.fixedStake ?? "0", match.currencyName)
                  : `${format(match.minBet, match.currencyName)}–${format(match.maxBet, match.currencyName)}`}
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

        {/* Admin: set the result / lock / void right here, no need to visit the admin page. */}
        {isAdmin && !isGala ? (
          <div className="flex flex-col gap-2">
            <p className="kicker text-danger">Admin · manage this match</p>
            <SettleMatchForm clanId={clanId} match={match} />
          </div>
        ) : null}

        {odds ? (
          <div className="flex flex-col gap-2">
            <OddsStrip teamA={match.teamA} teamB={match.teamB} odds={odds} />
            <OddsExplainer full className="px-3" />
          </div>
        ) : null}

        {match.status === "settled" && winningOutcome ? (
          <Card className="border-primary">
            <CardHeader>
              <p className="kicker">Result</p>
              <CardTitle className="text-xl">Final</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="kicker">Winning outcome</p>
              <span className="stamp w-fit text-primary text-base">
                {winningOutcome.label}
              </span>
            </CardContent>
          </Card>
        ) : null}

        {match.myBet && !showBetForm ? (
          <Card>
            <CardHeader>
              <p className="kicker">Saved</p>
              <CardTitle className="text-xl">Your bet</CardTitle>
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
                {match.myBet ? "Change it up" : isGala ? "Enter the pool" : "Make your pick"}
              </p>
              <CardTitle className="text-xl">
                {match.myBet ? "Edit your pick" : isGala ? "Grand Gala" : "Place your bet"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BetForm
                clanId={clanId}
                matchId={matchId}
                outcomes={match.outcomes}
                minBet={match.minBet}
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
              <p className="kicker">Betting closed</p>
              <p className="mt-1 dateline">This match is locked.</p>
            </CardContent>
          </Card>
        ) : null}

        {allBets && allBets.length > 0 ? (
          <Card>
            <CardHeader>
              <p className="kicker">On the record</p>
              <CardTitle className="text-xl">All bets</CardTitle>
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
              <Button variant="outline">← Matches</Button>
            </Link>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
