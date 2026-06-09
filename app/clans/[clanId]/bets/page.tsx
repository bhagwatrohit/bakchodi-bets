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
          <h1 className="text-2xl font-extrabold tracking-tight">Bet history</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every glorious win and questionable call in {clan.name}.
          </p>
        </div>

        {allBets ? (
          <Tabs defaultValue="mine">
            <TabsList>
              <TabsTrigger value="mine">My bets</TabsTrigger>
              <TabsTrigger value="all">All bets</TabsTrigger>
            </TabsList>
            <TabsContent value="mine">
              <BetHistoryTable rows={myBets} currencyName={clan.currencyName} />
            </TabsContent>
            <TabsContent value="all">
              <BetHistoryTable rows={allBets} currencyName={clan.currencyName} showPlayer />
            </TabsContent>
          </Tabs>
        ) : (
          <BetHistoryTable rows={myBets} currencyName={clan.currencyName} />
        )}
      </div>
    </AppShell>
  );
}
