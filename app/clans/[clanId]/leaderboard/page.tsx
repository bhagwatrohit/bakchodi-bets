import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanContext } from "@/lib/services/clans";
import { getLeaderboard } from "@/lib/services/bets";
import { AppShell } from "@/components/AppShell";
import { ClanNav } from "@/components/ClanNav";
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
      <ClanNav clanId={clanId} clanName={clan.name} isAdmin={ctx.membership.role === "admin"} />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="headline flex items-center gap-2 text-xl sm:text-2xl">
            <Trophy className="h-6 w-6 shrink-0" /> Leaderboard
          </h1>
          <p className="dateline">Ranked by net points from settled bets · bragging rights only</p>
        </div>
        <LeaderboardTable rows={rows} currencyName={clan.currencyName} />
      </div>
    </AppShell>
  );
}
