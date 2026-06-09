import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanContext } from "@/lib/services/clans";
import { getLeaderboard } from "@/lib/services/bets";
import { AppShell } from "@/components/AppShell";
import { LeaderboardTable } from "@/components/LeaderboardTable";

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
          <h1 className="text-2xl font-extrabold tracking-tight">Leaderboard of shame</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Who&apos;s flush and who&apos;s broke in {clan.name}. Stakes are bragging rights only.
          </p>
        </div>
        <LeaderboardTable rows={rows} currencyName={clan.currencyName} />
      </div>
    </AppShell>
  );
}
