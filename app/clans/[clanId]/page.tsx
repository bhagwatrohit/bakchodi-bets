import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanContext } from "@/lib/services/clans";
import { listMatches } from "@/lib/services/matches";
import { getLeaderboard } from "@/lib/services/bets";
import { AppShell } from "@/components/AppShell";
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
      className="flex items-start justify-between gap-3 border-b border-hairline pb-3 transition-colors last:border-b-0 last:pb-0 hover:text-accent"
    >
      <div className="min-w-0">
        <p className="dateline">{formatKickoff(match.startsAt)}</p>
        <p className="headline mt-0.5 truncate text-lg">{match.title}</p>
        {match.myBet ? (
          <p className="mt-0.5 text-xs italic text-ink-soft">
            Your call: {match.myBet.outcomeLabel}
          </p>
        ) : (
          <p className="tabular mt-0.5 text-xs text-ink-soft">
            {format(match.totalPot, currencyName)} in the pot
          </p>
        )}
      </div>
      <span
        className={`stamp shrink-0 ${match.status === "locked" ? "text-ink" : "text-accent"}`}
      >
        {match.status === "locked" ? "Locked" : "Open"}
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
      <div className="flex flex-col gap-7">
        {/* Masthead band */}
        <div>
          <p className="kicker text-center text-accent">The Official Gazette of</p>
          <h1 className="headline mt-1 text-center text-4xl sm:text-6xl">{clan.name}</h1>
          <hr className="rule-double mt-3" />
          <div className="flex flex-col gap-1 py-2 dateline sm:flex-row sm:items-center sm:justify-between">
            <span>
              {isAdmin ? "Editor-in-Chief" : "Subscriber"} · {profile.displayName}
            </span>
            <span>
              On Account: <span className="tabular text-ink">{format(membership.balance, clan.currencyName)}</span>
            </span>
            <span>
              {myRow ? `Standing No. ${myRow.rank}` : "Unranked"} of {leaderboard.length}
            </span>
          </div>
          <hr className="rule" />
        </div>

        {/* Section nav rail */}
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-y border-hairline py-2 font-condensed uppercase tracking-widest text-xs">
          <Link href={`/clans/${clanId}/matches`} className="hover:text-accent">
            Fixtures
          </Link>
          <span className="text-hairline">·</span>
          <Link href={`/clans/${clanId}/leaderboard`} className="hover:text-accent">
            Standings
          </Link>
          <span className="text-hairline">·</span>
          <Link href={`/clans/${clanId}/bets`} className="hover:text-accent">
            The Ledger
          </Link>
          {isAdmin ? (
            <>
              <span className="text-hairline">·</span>
              <Link href={`/clans/${clanId}/admin`} className="text-accent hover:underline">
                Editor&apos;s Desk
              </Link>
            </>
          ) : null}
        </nav>

        {/* Wire code column */}
        <div className="mx-auto w-full max-w-md">
          <p className="kicker mb-2 text-center">Pass the Wire — Recruit Your Crew</p>
          <InviteCopy inviteCode={clan.inviteCode} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's Card */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Today&apos;s Card</CardTitle>
              <Link
                href={`/clans/${clanId}/matches`}
                className="font-condensed uppercase tracking-widest text-xs text-accent hover:underline"
              >
                Full Fixtures →
              </Link>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {upcoming.length ? (
                upcoming.map((m) => (
                  <MatchRow key={m.id} clanId={clanId} match={m} currencyName={clan.currencyName} />
                ))
              ) : (
                <p className="text-sm italic text-ink-soft">
                  No fixtures on the wire yet.{" "}
                  {isAdmin ? "Head to the Editor's Desk to file one." : "Check back soon."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* League Standings preview */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>League Standings</CardTitle>
              <Link
                href={`/clans/${clanId}/leaderboard`}
                className="font-condensed uppercase tracking-widest text-xs text-accent hover:underline"
              >
                Full Table →
              </Link>
            </CardHeader>
            <CardContent>
              {topFive.length ? (
                <ol className="flex flex-col">
                  {topFive.map((row) => (
                    <li
                      key={row.userId}
                      className={`flex items-center justify-between gap-3 border-b border-hairline py-2 text-sm last:border-b-0 ${
                        row.isMe ? "font-semibold text-accent" : ""
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="tabular w-6 shrink-0 text-ink-soft">{row.rank}</span>
                        <span className="truncate font-condensed uppercase tracking-wide">
                          {row.displayName}
                          {row.isMe ? " (you)" : ""}
                        </span>
                      </span>
                      <span className="tabular shrink-0">{format(row.balance, clan.currencyName)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm italic text-ink-soft">No names on the rolls yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Latest Results */}
        {recent.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Latest Results</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {recent.map((m) => {
                const winner = m.outcomes.find((o) => o.id === m.winningOutcomeId);
                return (
                  <Link
                    key={m.id}
                    href={`/clans/${clanId}/matches/${m.id}`}
                    className="flex items-start justify-between gap-3 border-b border-hairline pb-3 transition-colors last:border-b-0 last:pb-0 hover:text-accent"
                  >
                    <div className="min-w-0">
                      <p className="dateline">{formatKickoff(m.startsAt)}</p>
                      <p className="headline mt-0.5 truncate text-lg">{m.title}</p>
                      {winner ? (
                        <p className="mt-0.5 text-xs italic text-ink-soft">
                          Final call: {winner.label}
                        </p>
                      ) : null}
                      {m.myBet ? (
                        <p
                          className={`mt-0.5 text-xs italic ${
                            m.myBet.status === "won"
                              ? "text-success"
                              : m.myBet.status === "lost"
                                ? "text-danger"
                                : "text-ink-soft"
                          }`}
                        >
                          Your call: {m.myBet.outcomeLabel}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`stamp shrink-0 ${winner ? "text-success" : "text-ink"}`}
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
