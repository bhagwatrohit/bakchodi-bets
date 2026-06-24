import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { MatchBrowser } from "@/components/MatchBrowser";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanContext } from "@/lib/services/clans";
import { listMatches } from "@/lib/services/matches";

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

  return (
    <AppShell profile={profile}>
      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-1.5">
          <p className="kicker">{ctx.clan.name}</p>
          <h1 className="headline text-2xl sm:text-3xl">Matches</h1>
          <p className="dateline">
            Pick your games, lock in before kickoff, climb the leaderboard.
          </p>
        </header>

        <MatchBrowser
          matches={regular}
          clanId={clanId}
          currencyName={ctx.clan.currencyName}
        />
      </div>
    </AppShell>
  );
}
