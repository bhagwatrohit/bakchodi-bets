import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarClock, ListChecks, Settings, Swords, Trophy } from "lucide-react";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanContext } from "@/lib/services/clans";
import { listMatches } from "@/lib/services/matches";
import { getLeaderboard } from "@/lib/services/bets";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteCopy } from "@/components/InviteCopy";
import { format } from "@/lib/money";
import type { MatchListItem } from "@/lib/types";

function formatKickoff(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function MatchRow({
  clanId,
  match,
  currencyName,
}: {
  clanId: string;
  match: MatchListItem;
  currencyName: string;
}) {
  return (
    <Link
      href={`/clans/${clanId}/matches/${match.id}`}
      className="flex items-center justify-between gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{match.title}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
          {formatKickoff(match.startsAt)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {match.status === "locked" ? (
          <Badge variant="outline">Locked</Badge>
        ) : (
          <Badge variant="primary">Open</Badge>
        )}
        {match.myBet ? (
          <span className="text-xs text-muted-foreground">
            You: {match.myBet.outcomeLabel}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {format(match.totalPot, currencyName)} pot
          </span>
        )}
      </div>
    </Link>
  );
}

export default async function ClanHomePage({
  params,
}: {
  params: Promise<{ clanId: string }>;
}) {
  const { clanId } = await params;

  const profile = await getSessionProfile();
  if (!profile) redirect(`/login?next=/clans/${clanId}`);

  const ctx = await getClanContext(clanId);
  if (!ctx) redirect("/dashboard");
  const { clan, membership } = ctx;

  const [matches, leaderboard] = await Promise.all([
    listMatches(clanId),
    getLeaderboard(clanId),
  ]);

  const upcoming = matches
    .filter((m) => m.status === "open" || m.status === "locked")
    .slice(0, 3);
  const recent = matches
    .filter((m) => m.status === "settled")
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
    .slice(0, 3);
  const topFive = leaderboard.slice(0, 5);
  const myRow = leaderboard.find((r) => r.isMe);
  const isAdmin = membership.role === "admin";

  return (
    <AppShell profile={profile}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight">{clan.name}</h1>
              <Badge variant={isAdmin ? "accent" : "default"}>
                {isAdmin ? "Admin" : "Member"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {myRow ? `Rank #${myRow.rank}` : "Unranked"} of {leaderboard.length} ·{" "}
              {clan.currencyName}
            </p>
          </div>
          <div className="rounded-lg bg-primary/10 px-4 py-3 text-right">
            <p className="text-xs font-medium text-muted-foreground">Your balance</p>
            <p className="text-2xl font-extrabold text-primary">
              {format(membership.balance, clan.currencyName)}
            </p>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex flex-wrap gap-2">
          <Link href={`/clans/${clanId}/matches`}>
            <Button variant="outline" size="sm">
              <Swords className="h-4 w-4" /> Matches
            </Button>
          </Link>
          <Link href={`/clans/${clanId}/leaderboard`}>
            <Button variant="outline" size="sm">
              <Trophy className="h-4 w-4" /> Leaderboard
            </Button>
          </Link>
          <Link href={`/clans/${clanId}/bets`}>
            <Button variant="outline" size="sm">
              <ListChecks className="h-4 w-4" /> My bets
            </Button>
          </Link>
          {isAdmin ? (
            <Link href={`/clans/${clanId}/admin`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" /> Admin
              </Button>
            </Link>
          ) : null}
        </div>

        {/* Invite */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite your crew</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteCopy inviteCode={clan.inviteCode} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming matches */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Upcoming matches</CardTitle>
              <Link
                href={`/clans/${clanId}/matches`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                See all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {upcoming.length ? (
                upcoming.map((m) => (
                  <MatchRow key={m.id} clanId={clanId} match={m} currencyName={clan.currencyName} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No matches lined up yet.{" "}
                  {isAdmin ? "Head to Admin to add one." : "Check back soon."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard preview */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Leaderboard</CardTitle>
              <Link
                href={`/clans/${clanId}/leaderboard`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Full leaderboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {topFive.length ? (
                <ol className="flex flex-col gap-1.5">
                  {topFive.map((row) => (
                    <li
                      key={row.userId}
                      className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${
                        row.isMe ? "bg-primary/10 font-semibold" : ""
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="w-6 shrink-0 text-muted-foreground">#{row.rank}</span>
                        <span className="truncate">
                          {row.displayName}
                          {row.isMe ? " (you)" : ""}
                        </span>
                      </span>
                      <span className="shrink-0">{format(row.balance, clan.currencyName)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No members yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent results */}
        {recent.length ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent results</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {recent.map((m) => {
                const winner = m.outcomes.find((o) => o.id === m.winningOutcomeId);
                return (
                  <Link
                    key={m.id}
                    href={`/clans/${clanId}/matches/${m.id}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{m.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatKickoff(m.startsAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {winner ? (
                        <Badge variant="success">{winner.label}</Badge>
                      ) : (
                        <Badge variant="default">Settled</Badge>
                      )}
                      {m.myBet ? (
                        <span
                          className={`text-xs ${
                            m.myBet.status === "won"
                              ? "text-success"
                              : m.myBet.status === "lost"
                                ? "text-danger"
                                : "text-muted-foreground"
                          }`}
                        >
                          You: {m.myBet.outcomeLabel}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
