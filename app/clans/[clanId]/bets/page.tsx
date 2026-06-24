import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanContext } from "@/lib/services/clans";
import { listAllBets, listMyBets } from "@/lib/services/bets";
import { AppShell } from "@/components/AppShell";
import { ClanNav } from "@/components/ClanNav";
import { BetHistoryTable } from "@/components/BetHistoryTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BetHistoryRow } from "@/lib/types";

export default async function BetsPage({
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

  const myBets = await listMyBets(clanId);

  // All-bets is gated by role + clan visibility inside the service; it throws
  // `forbidden` for members who aren't allowed to see it. Try it and fall back
  // to just My bets if it's not available.
  let allBets: BetHistoryRow[] | null = null;
  try {
    allBets = await listAllBets(clanId);
  } catch {
    allBets = null;
  }

  return (
    <AppShell profile={profile}>
      <ClanNav clanId={clanId} clanName={clan.name} isAdmin={ctx.membership.role === "admin"} />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="headline text-xl sm:text-2xl">My bets</h1>
          <p className="dateline">Every win and questionable call in {clan.name}</p>
        </div>

        {allBets ? (
          <Tabs defaultValue="mine">
            <TabsList>
              <TabsTrigger value="mine">My bets</TabsTrigger>
              <TabsTrigger value="all">All bets</TabsTrigger>
            </TabsList>
            <TabsContent value="mine">
              <p className="kicker mb-2">My bets</p>
              <BetHistoryTable rows={myBets} currencyName={clan.currencyName} />
            </TabsContent>
            <TabsContent value="all">
              <p className="kicker mb-2">All bets</p>
              <BetHistoryTable rows={allBets} currencyName={clan.currencyName} showPlayer />
            </TabsContent>
          </Tabs>
        ) : (
          <div>
            <p className="kicker mb-2">My bets</p>
            <BetHistoryTable rows={myBets} currencyName={clan.currencyName} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
