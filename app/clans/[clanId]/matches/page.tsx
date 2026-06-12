import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { MatchesTabs } from "@/components/MatchesTabs";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanContext } from "@/lib/services/clans";
import { listMatches } from "@/lib/services/matches";
import {
  getWorldCupOdds,
  oddsViewFor,
  type MatchOddsView,
} from "@/lib/services/worldcup-feed";
import type { MatchListItem } from "@/lib/types";

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ clanId: string }>;
}) {
  const { clanId } = await params;

  const profile = await getSessionProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent(`/clans/${clanId}/matches`)}`);

  const ctx = await getClanContext(clanId);
  if (!ctx) redirect("/dashboard");

  const matches = await listMatches(clanId);

  // The Grand Gala lives on its own page (/gala) — keep it out of the list.
  const regular = matches.filter((m) => m.marketType === "match");

  const open: MatchListItem[] = [];
  const locked: MatchListItem[] = [];
  const settled: MatchListItem[] = [];
  for (const m of regular) {
    if (m.displayStatus === "open") open.push(m);
    else if (m.displayStatus === "locked" || m.displayStatus === "final") locked.push(m);
    else if (m.displayStatus === "settled") settled.push(m);
  }

  // Bookmaker lines for the open card (best-effort; absent when feed is down).
  const oddsEntries = await getWorldCupOdds();
  const odds: Record<string, MatchOddsView> = {};
  if (oddsEntries) {
    for (const m of open) {
      const view = oddsViewFor(oddsEntries, m.teamA, m.teamB);
      if (view) odds[m.id] = view;
    }
  }

  return (
    <AppShell profile={profile}>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="kicker">MATCHES · {ctx.clan.name}</p>
          <h1 className="headline text-3xl sm:text-5xl">MATCH SELECT</h1>
          <p className="dateline">
            Drop your fake-credit picks and climb the high-score board — every
            call goes on the record.
          </p>
          <hr className="rule-thick mt-1" />
        </header>

        <MatchesTabs
          open={open}
          locked={locked}
          settled={settled}
          clanId={clanId}
          currencyName={ctx.clan.currencyName}
          odds={odds}
        />
      </div>
    </AppShell>
  );
}
