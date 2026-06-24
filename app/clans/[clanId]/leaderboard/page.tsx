import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanContext } from "@/lib/services/clans";
import { getLeaderboard } from "@/lib/services/bets";
import { AppShell } from "@/components/AppShell";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Trophy } from "@/components/Trophy";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ clanId: string }>;
}) {
  const { clanId } = await params;

  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const ctx = await getClanContext(clanId);
  if (!ctx) redirect("/dashboard");
  const { clan } = ctx;

  const rows = await getLeaderboard(clanId);

  return (
    <AppShell profile={profile}>
      <div className="flex flex-col gap-6">
        <div>
          <p className="kicker text-muted-foreground">Top players</p>
          <h1 className="headline mt-1 flex items-center gap-3 text-3xl sm:text-5xl">
            <Trophy className="h-9 w-9 shrink-0" /> Leaderboard
          </h1>
          <hr className="rule-thick mt-3" />
          <p className="dateline mt-2">
            Standings for {clan.name} · bragging rights only · no cash value
          </p>
        </div>
        <LeaderboardTable rows={rows} currencyName={clan.currencyName} />
      </div>
    </AppShell>
  );
}
