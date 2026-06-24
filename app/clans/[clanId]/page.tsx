import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanContext } from "@/lib/services/clans";
import { listMatches } from "@/lib/services/matches";
import { getLeaderboard } from "@/lib/services/bets";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteCopy } from "@/components/InviteCopy";
import { Trophy } from "@/components/Trophy";
import { Flag } from "@/components/Flag";
import { LocalTime } from "@/components/LocalTime";
import { format } from "@/lib/money";
import type { MatchListItem } from "@/lib/types";

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
      className="flex items-start justify-between gap-3 border-b border-hairline pb-3 transition-colors last:border-b-0 last:pb-0 hover:text-accent"
    >
      <div className="min-w-0">
        <LocalTime value={match.startsAt} className="dateline" />
        <div className="mt-0.5 flex items-center gap-2">
          <Flag team={match.teamA} size="sm" />
          <p className="matchup truncate text-lg sm:text-xl">{match.title}</p>
          <Flag team={match.teamB} size="sm" />
        </div>
        {match.myBet ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your call: {match.myBet.outcomeLabel}
          </p>
        ) : (
          <p className="tabular mt-0.5 text-xs text-muted-foreground">
            {format(match.totalPot, currencyName)} in the pot
          </p>
        )}
      </div>
      <span
        className={`stamp shrink-0 ${match.displayStatus === "locked" ? "text-[var(--accent-amber)]" : "text-primary"}`}
      >
        {match.displayStatus === "locked" ? "Locked" : "Open"}
      </span>
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
    .filter((m) => m.displayStatus === "open" || m.displayStatus === "locked")
    .slice(0, 3);
  const recent = matches
    .filter((m) => m.displayStatus === "settled")
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
    .slice(0, 3);
  const topFive = leaderboard.slice(0, 5);
  const myRow = leaderboard.find((r) => r.isMe);
  const isAdmin = membership.role === "admin";
  const gala = matches.find((m) => m.marketType === "tournament_winner");

  return (
    <AppShell profile={profile}>
      <div className="flex flex-col gap-7">
        {/* Title band */}
        <div>
          <div className="flex flex-col items-center gap-3">
            <Trophy className="h-12 w-12" />
            <h1 className="headline text-center text-2xl sm:text-5xl">{clan.name}</h1>
          </div>
          <hr className="rule-thick mt-3" />
          <div className="flex flex-col gap-1 py-2 dateline sm:flex-row sm:items-center sm:justify-between">
            <span>
              {isAdmin ? "Player 1 · Admin" : "Player"} · {profile.displayName}
            </span>
            <span>
              Credits: <span className="tabular text-primary">{format(membership.balance, clan.currencyName)}</span>
            </span>
            <span>
              {myRow ? `Rank ${myRow.rank}` : "Unranked"} of {leaderboard.length}
            </span>
          </div>
          <hr className="rule" />
        </div>

        {/* Section nav rail */}
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-y border-border py-2 text-sm">
          <Link href={`/clans/${clanId}/matches`} className="text-muted-foreground hover:text-foreground">
            Matches
          </Link>
          <span className="text-border">·</span>
          <Link href={`/clans/${clanId}/gala`} className="text-[var(--accent-amber)] hover:text-foreground">
            🏆 Grand Gala
          </Link>
          <span className="text-border">·</span>
          <Link href={`/clans/${clanId}/leaderboard`} className="text-muted-foreground hover:text-foreground">
            Leaderboard
          </Link>
          <span className="text-border">·</span>
          <Link href={`/clans/${clanId}/bets`} className="text-muted-foreground hover:text-foreground">
            My bets
          </Link>
          {isAdmin ? (
            <>
              <span className="text-border">·</span>
              <Link href={`/clans/${clanId}/admin`} className="text-danger hover:text-foreground">
                Admin
              </Link>
            </>
          ) : null}
        </nav>

        {/* Clan code column */}
        <div className="mx-auto w-full max-w-md">
          <p className="kicker mb-2 text-center">Clan code — invite your crew</p>
          <InviteCopy inviteCode={clan.inviteCode} />
        </div>

        {/* Grand Gala banner */}
        {gala && gala.status !== "settled" ? (
          <Link
            href={`/clans/${clanId}/gala`}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
          >
            <span className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <span>
                <span className="kicker text-[var(--accent-amber)]">Grand Gala</span>
                <span className="block matchup text-lg">Pick the World Cup winner</span>
              </span>
            </span>
            <span className="text-right">
              <span className="block dateline">Pot</span>
              <span className="tabular text-[var(--accent-amber)]">
                {format(gala.totalPot, clan.currencyName)}
              </span>
            </span>
          </Link>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Now Playing */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Upcoming matches</CardTitle>
              <Link
                href={`/clans/${clanId}/matches`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                All matches →
              </Link>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {upcoming.length ? (
                upcoming.map((m) => (
                  <MatchRow key={m.id} clanId={clanId} match={m} currencyName={clan.currencyName} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No matches loaded yet.{" "}
                  {isAdmin ? "Head to Admin to add one." : "Check back soon."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard preview */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Leaderboard</CardTitle>
              <Link
                href={`/clans/${clanId}/leaderboard`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Full table →
              </Link>
            </CardHeader>
            <CardContent>
              {topFive.length ? (
                <ol className="flex flex-col">
                  {topFive.map((row) => (
                    <li
                      key={row.userId}
                      className={`flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-b-0 ${
                        row.isMe ? "font-semibold text-primary" : ""
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="tabular w-6 shrink-0 text-muted-foreground">{row.rank}</span>
                        <span className="truncate">
                          {row.displayName}
                          {row.isMe ? " (you)" : ""}
                        </span>
                      </span>
                      <span className="tabular shrink-0">{format(row.balance, clan.currencyName)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No players on the board yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Final Scores */}
        {recent.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Final scores</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {recent.map((m) => {
                const winner = m.outcomes.find((o) => o.id === m.winningOutcomeId);
                return (
                  <Link
                    key={m.id}
                    href={`/clans/${clanId}/matches/${m.id}`}
                    className="flex items-start justify-between gap-3 border-b border-border pb-3 transition-colors last:border-b-0 last:pb-0 hover:text-accent"
                  >
                    <div className="min-w-0">
                      <LocalTime value={m.startsAt} className="dateline" />
                      <div className="mt-0.5 flex items-center gap-2">
                        <Flag team={m.teamA} size="sm" />
                        <p className="matchup truncate text-lg sm:text-xl">{m.title}</p>
                        <Flag team={m.teamB} size="sm" />
                      </div>
                      {winner ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Final call: {winner.label}
                        </p>
                      ) : null}
                      {m.myBet ? (
                        <p
                          className={`mt-0.5 text-xs ${
                            m.myBet.status === "won"
                              ? "text-primary"
                              : m.myBet.status === "lost"
                                ? "text-danger"
                                : "text-muted-foreground"
                          }`}
                        >
                          Your call: {m.myBet.outcomeLabel}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`stamp shrink-0 ${winner ? "text-primary" : "text-[var(--accent-amber)]"}`}
                    >
                      {winner ? "Result" : "Settled"}
                    </span>
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
