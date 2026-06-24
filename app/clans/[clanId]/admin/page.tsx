import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanContext, listMembers } from "@/lib/services/clans";
import { listMatches } from "@/lib/services/matches";
import { listAllBets, getLeaderboard } from "@/lib/services/bets";
import { RemoveMemberButton } from "@/components/admin/RemoveMemberButton";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ClanSettingsForm } from "@/components/admin/ClanSettingsForm";
import { CreateMatchForm } from "@/components/admin/CreateMatchForm";
import { SettleMatchForm } from "@/components/admin/SettleMatchForm";
import { AdjustBalanceForm } from "@/components/admin/AdjustBalanceForm";
import { Flag } from "@/components/Flag";
import { format } from "@/lib/money";
import type { BetStatus } from "@/lib/types";

function betStatusBadge(status: BetStatus) {
  switch (status) {
    case "won":
      return <span className="stamp text-primary">Won</span>;
    case "lost":
      return <span className="stamp text-danger">Lost</span>;
    case "void":
      return <span className="stamp text-muted-foreground">Void</span>;
    default:
      return <span className="stamp text-muted-foreground">Pending</span>;
  }
}

export default async function ClanAdminPage({
  params,
}: {
  params: Promise<{ clanId: string }>;
}) {
  const { clanId } = await params;

  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const ctx = await getClanContext(clanId);
  if (!ctx || ctx.membership.role !== "admin") redirect(`/clans/${clanId}`);
  const { clan } = ctx;

  const [matches, bets, leaderboard, crew] = await Promise.all([
    listMatches(clanId),
    listAllBets(clanId),
    getLeaderboard(clanId),
    listMembers(clanId),
  ]);

  const members = leaderboard.map((r) => ({
    userId: r.userId,
    displayName: r.displayName,
  }));

  return (
    <AppShell profile={profile}>
      <div className="flex flex-col gap-6">
        {/* Masthead */}
        <div className="flex flex-col gap-2">
          <Link
            href={`/clans/${clanId}`}
            className="dateline inline-flex w-fit items-center gap-1 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to {clan.name}
          </Link>
          <div className="flex items-center gap-3">
            <p className="kicker text-muted-foreground">Admin</p>
            <span className="stamp text-danger">Admins only</span>
          </div>
          <h1 className="headline text-3xl sm:text-5xl">Admin console</h1>
          <hr className="rule-thick" />
          <p className="dateline">
            Manage settings, add matches, and settle results for this clan.
          </p>
        </div>

        {/* House rules */}
        <Card>
          <CardHeader>
            <p className="kicker text-muted-foreground">Settings</p>
            <CardTitle className="headline text-2xl">Game settings</CardTitle>
            <hr className="rule mt-1" />
            <CardDescription>Clan name, currency, max bet, and pick visibility.</CardDescription>
          </CardHeader>
          <CardContent>
            <ClanSettingsForm clan={clan} />
          </CardContent>
        </Card>

        {/* Invite */}
        <Card>
          <CardHeader>
            <p className="kicker text-muted-foreground">Invite</p>
            <CardTitle className="headline text-2xl">Invite code</CardTitle>
            <hr className="rule mt-1" />
            <CardDescription>Share this so new players can join the clan.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <code className="tabular w-fit rounded-md border border-border bg-muted px-3 py-1.5 text-base font-bold tracking-widest text-primary">
              {clan.inviteCode}
            </code>
            <p className="dateline">
              Join link:{" "}
              <code className="tabular rounded-md bg-muted px-1.5 py-0.5">/join/{clan.inviteCode}</code>
            </p>
          </CardContent>
        </Card>

        {/* Create match */}
        <Card>
          <CardHeader>
            <p className="kicker text-muted-foreground">Matches</p>
            <CardTitle className="headline text-2xl">Add match</CardTitle>
            <hr className="rule mt-1" />
            <CardDescription>Set up a match for the clan to bet on.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateMatchForm clanId={clanId} />
          </CardContent>
        </Card>

        {/* Matches admin list */}
        <Card>
          <CardHeader>
            <p className="kicker text-muted-foreground">Matches</p>
            <CardTitle className="headline text-2xl">Manage matches</CardTitle>
            <hr className="rule mt-1" />
            <CardDescription>Lock, re-open, settle, or void each match.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {matches.length ? (
              matches.map((m) => <SettleMatchForm key={m.id} clanId={clanId} match={m} />)
            ) : (
              <p className="text-sm text-muted-foreground">No matches yet — create one above.</p>
            )}
          </CardContent>
        </Card>

        {/* All bets */}
        <Card>
          <CardHeader>
            <p className="kicker text-muted-foreground">Activity</p>
            <CardTitle className="headline text-2xl">All bets</CardTitle>
            <hr className="rule mt-1" />
            <CardDescription>Every bet placed across the clan.</CardDescription>
          </CardHeader>
          <CardContent>
            {bets.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Pick</TableHead>
                    <TableHead>Stake</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bets.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Flag team={b.teamA} size="sm" />
                          {b.matchTitle}
                          <Flag team={b.teamB} size="sm" />
                        </span>
                      </TableCell>
                      <TableCell>{b.displayName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5">
                          {b.pick !== "Draw" ? <Flag team={b.pick} size="sm" /> : null}
                          {b.pick}
                        </span>
                      </TableCell>
                      <TableCell className="tabular">{format(b.stake, clan.currencyName)}</TableCell>
                      <TableCell>{betStatusBadge(b.status)}</TableCell>
                      <TableCell className="tabular">{format(b.payout, clan.currencyName)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No bets placed yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Manage crew */}
        <Card>
          <CardHeader>
            <p className="kicker text-muted-foreground">Members</p>
            <CardTitle className="headline text-2xl">Manage members</CardTitle>
            <hr className="rule mt-1" />
            <CardDescription>
              Remove a member from the clan. This also deletes their bets and
              ledger here, and can&apos;t be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {crew.map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{m.displayName}</span>
                  {m.role === "admin" ? (
                    <span className="stamp text-[0.5rem] text-[var(--accent-amber)]">Admin</span>
                  ) : null}
                  {m.isMe ? <span className="dateline">· you</span> : null}
                  <span className="tabular text-muted-foreground">
                    {format(m.balance, clan.currencyName)}
                  </span>
                </span>
                {m.role !== "admin" && !m.isMe ? (
                  <RemoveMemberButton
                    clanId={clanId}
                    userId={m.userId}
                    displayName={m.displayName}
                  />
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Manual balance adjustment */}
        <Card>
          <CardHeader>
            <p className="kicker text-muted-foreground">Balances</p>
            <CardTitle className="headline text-2xl">Adjust balance</CardTitle>
            <hr className="rule mt-1" />
            <CardDescription>
              Adjust a member&apos;s balance up or down. Every change is recorded on the ledger.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length ? (
              <AdjustBalanceForm
                clanId={clanId}
                members={members}
                currencyName={clan.currencyName}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No members to adjust yet.</p>
            )}
          </CardContent>
        </Card>

        <div>
          <Link href={`/clans/${clanId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back to clan
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
