import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanContext } from "@/lib/services/clans";
import { listMatches } from "@/lib/services/matches";
import { listAllBets, getLeaderboard } from "@/lib/services/bets";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
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
import { format } from "@/lib/money";
import type { BetStatus } from "@/lib/types";

function betStatusBadge(status: BetStatus) {
  switch (status) {
    case "won":
      return <Badge variant="success">Won</Badge>;
    case "lost":
      return <Badge variant="danger">Lost</Badge>;
    case "void":
      return <Badge variant="outline">Void</Badge>;
    default:
      return <Badge variant="primary">Pending</Badge>;
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

  const [matches, bets, leaderboard] = await Promise.all([
    listMatches(clanId),
    listAllBets(clanId),
    getLeaderboard(clanId),
  ]);

  const members = leaderboard.map((r) => ({
    userId: r.userId,
    displayName: r.displayName,
  }));

  return (
    <AppShell profile={profile}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <Link
            href={`/clans/${clanId}`}
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to {clan.name}
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Admin</h1>
            <Badge variant="accent">Admin only</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Run the house: tweak rules, create matches, settle the chaos.
          </p>
        </div>

        {/* House rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">House rules</CardTitle>
            <CardDescription>Clan name, currency, max bet, and pick visibility.</CardDescription>
          </CardHeader>
          <CardContent>
            <ClanSettingsForm clan={clan} />
          </CardContent>
        </Card>

        {/* Invite */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite code</CardTitle>
            <CardDescription>Share this so new players can join the clan.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <code className="w-fit rounded-md bg-muted px-3 py-1.5 text-base font-bold tracking-widest">
              {clan.inviteCode}
            </code>
            <p className="text-xs text-muted-foreground">
              Join link:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">/join/{clan.inviteCode}</code>
            </p>
          </CardContent>
        </Card>

        {/* Create match */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New match</CardTitle>
            <CardDescription>Set up a fixture for the clan to bet on.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateMatchForm clanId={clanId} />
          </CardContent>
        </Card>

        {/* Matches admin list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matches</CardTitle>
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
            <CardTitle className="text-base">All bets</CardTitle>
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
                      <TableCell className="font-medium">{b.matchTitle}</TableCell>
                      <TableCell>{b.displayName}</TableCell>
                      <TableCell>{b.pick}</TableCell>
                      <TableCell>{format(b.stake, clan.currencyName)}</TableCell>
                      <TableCell>{betStatusBadge(b.status)}</TableCell>
                      <TableCell>{format(b.payout, clan.currencyName)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No bets placed yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Manual balance adjustment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manual balance adjustment</CardTitle>
            <CardDescription>
              Nudge a member&apos;s balance up or down — every change hits the ledger.
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
