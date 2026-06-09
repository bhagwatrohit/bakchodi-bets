import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanContext } from "@/lib/services/clans";
import { listAllBets, listMyBets } from "@/lib/services/bets";
import { AppShell } from "@/components/AppShell";
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
      <div className="flex flex-col gap-6">
        <div>
          <p className="kicker text-neon-cyan">Play Log</p>
          <h1 className="headline mt-1 text-3xl sm:text-5xl">MY BETS</h1>
          <hr className="rule-thick mt-3" />
          <p className="dateline mt-2">
            Every glorious win and questionable call in {clan.name}
          </p>
        </div>

        {allBets ? (
          <Tabs defaultValue="mine">
            <TabsList>
              <TabsTrigger value="mine">MY BETS</TabsTrigger>
              <TabsTrigger value="all">ALL BETS</TabsTrigger>
            </TabsList>
            <TabsContent value="mine">
              <p className="kicker mb-2">MY BETS</p>
              <BetHistoryTable rows={myBets} currencyName={clan.currencyName} />
            </TabsContent>
            <TabsContent value="all">
              <p className="kicker mb-2">ALL BETS</p>
              <BetHistoryTable rows={allBets} currencyName={clan.currencyName} showPlayer />
            </TabsContent>
          </Tabs>
        ) : (
          <div>
            <p className="kicker mb-2">MY BETS</p>
            <BetHistoryTable rows={myBets} currencyName={clan.currencyName} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
