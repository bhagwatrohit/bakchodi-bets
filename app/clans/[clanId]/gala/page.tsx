import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BetForm } from "@/components/BetForm";
import { Flag } from "@/components/Flag";
import { Trophy } from "@/components/Trophy";
import { GalaEntryForm } from "@/components/admin/GalaEntryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { getGrandGala } from "@/lib/services/matches";
import { listAllBets } from "@/lib/services/bets";
import { format } from "@/lib/money";
import type { BetHistoryRow } from "@/lib/types";

const BET_STATUS_META: Record<string, { label: string; variant: "default" | "success" | "danger" | "outline" }> = {
  pending: { label: "IN", variant: "outline" },
  won: { label: "CHAMPION", variant: "success" },
  lost: { label: "OUT", variant: "danger" },
  void: { label: "REFUNDED", variant: "default" },
};

export default async function GrandGalaPage({
  params,
}: {
  params: Promise<{ clanId: string }>;
}) {
  const { clanId } = await params;

  const profile = await getSessionProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent(`/clans/${clanId}/gala`)}`);

  const ctx = await getClanContext(clanId);
  if (!ctx) redirect("/dashboard");

  const gala = await getGrandGala(clanId);

  const winningOutcome = gala?.winningOutcomeId
    ? gala.outcomes.find((o) => o.id === gala.winningOutcomeId)
    : null;

  const now = Date.now();
  // Open window: can enter OR change an existing pick any number of times.
  const canEnter =
    gala != null &&
    gala.status === "open" &&
    !(gala.clanLockAtStart && new Date(gala.startsAt).getTime() <= now);

  // Who's in the pool (visibility enforced by the service).
  let allBets: BetHistoryRow[] | null = null;
  if (gala) {
    try {
      allBets = await listAllBets(clanId, gala.id);
    } catch {
      allBets = null;
    }
  }

  return (
    <AppShell profile={profile}>
      <div className="flex flex-col gap-6">
        <Link href={`/clans/${clanId}`} className="dateline hover:text-neon-cyan">
          « {ctx.clan.name}
        </Link>

        {!gala ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="kicker text-neon-amber">No Grand Gala</p>
              <p className="mt-2 dateline">This clan doesn&apos;t have a Grand Gala pot.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Marquee */}
            <div className="flex flex-col items-center gap-3 border-2 border-neon-amber bg-card p-6 text-center">
              <Trophy className="h-16 w-16" />
              <p className="kicker text-neon-amber">Grand Gala</p>
              <h1 className="headline text-2xl sm:text-4xl">World Cup Winner</h1>
              <p className="dateline">
                Pick the champion · entry closes when the knockouts begin
              </p>
              <Badge variant={gala.displayStatus === "open" ? "success" : "outline"}>
                {gala.displayStatus === "open" ? "ENTRIES OPEN" : "ENTRIES CLOSED"}
              </Badge>
            </div>

            {/* Stat band */}
            <Card>
              <CardContent className="grid grid-cols-2 gap-y-3 py-5 sm:grid-cols-4 sm:divide-x sm:divide-grid">
                <div className="sm:px-4 sm:first:pl-0">
                  <p className="kicker">Entry</p>
                  <p className="tabular text-lg font-semibold">
                    {format(gala.fixedStake ?? "0", gala.currencyName)}
                  </p>
                </div>
                <div className="sm:px-4">
                  <p className="kicker">Your Balance</p>
                  <p className="tabular text-lg font-semibold">
                    {format(gala.availableBalance, gala.currencyName)}
                  </p>
                </div>
                <div className="sm:px-4">
                  <p className="kicker">Prize Pot</p>
                  <p className="tabular text-lg font-semibold text-neon-amber">
                    {format(gala.totalPot, gala.currencyName)}
                  </p>
                </div>
                <div className="sm:px-4">
                  <p className="kicker">Entries</p>
                  <p className="tabular text-lg font-semibold">{gala.betCount}</p>
                </div>
              </CardContent>
            </Card>

            {/* Admin: edit the fixed entry stake */}
            {ctx.membership.role === "admin" && gala.status !== "settled" ? (
              <GalaEntryForm
                clanId={clanId}
                matchId={gala.id}
                currentStake={gala.fixedStake ?? "0"}
              />
            ) : null}

            {/* Champion result */}
            {gala.status === "settled" && winningOutcome ? (
              <Card className="border-2 border-neon-green">
                <CardHeader>
                  <p className="kicker">CHAMPIONS</p>
                  <CardTitle className="headline text-2xl">WE HAVE A WINNER</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <Flag team={winningOutcome.label} size="xl" />
                  <span className="matchup text-2xl">{winningOutcome.label}</span>
                </CardContent>
              </Card>
            ) : null}

            {/* Your entry (read-only once entries are closed) */}
            {gala.myBet && !canEnter ? (
              <Card>
                <CardHeader>
                  <p className="kicker">YOUR PICK</p>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-2 matchup text-xl">
                    <Flag team={gala.myBet.outcomeLabel} size="md" />
                    {gala.myBet.outcomeLabel}
                  </span>
                  <Badge variant={BET_STATUS_META[gala.myBet.status].variant}>
                    {BET_STATUS_META[gala.myBet.status].label}
                  </Badge>
                  {gala.myBet.status !== "pending" ? (
                    <span className="tabular text-muted-foreground">
                      Payout {format(gala.myBet.payout, gala.currencyName)}
                    </span>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {/* Enter / edit */}
            {canEnter ? (
              <Card>
                <CardHeader>
                  <p className="kicker">{gala.myBet ? "CHANGE YOUR CALL" : "ENTER THE POOL"}</p>
                  <CardTitle className="headline text-2xl">
                    {gala.myBet ? "EDIT YOUR PICK" : "PICK THE CHAMPION"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BetForm
                    clanId={clanId}
                    matchId={gala.id}
                    outcomes={gala.outcomes}
                    maxBet={gala.maxBet}
                    availableBalance={gala.availableBalance}
                    currencyName={gala.currencyName}
                    marketType={gala.marketType}
                    fixedStake={gala.fixedStake}
                    existingBet={
                      gala.myBet
                        ? { outcomeId: gala.myBet.outcomeId, stake: gala.myBet.stake }
                        : null
                    }
                  />
                </CardContent>
              </Card>
            ) : !gala.myBet && gala.status !== "settled" ? (
              <Card>
                <CardContent className="py-6 text-center">
                  <p className="kicker text-neon-amber">Entries Closed</p>
                  <p className="mt-1 dateline">The knockouts have begun — no new entries.</p>
                </CardContent>
              </Card>
            ) : null}

            {/* The field */}
            {allBets && allBets.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="headline text-xl">THE FIELD</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Pick</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allBets.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">{b.displayName}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              <Flag team={b.pick} size="sm" />
                              {b.pick}
                            </span>
                          </TableCell>
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
          </>
        )}
      </div>
    </AppShell>
  );
}
