import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { MatchesTabs } from "@/components/MatchesTabs";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanContext } from "@/lib/services/clans";
import { listMatches } from "@/lib/services/matches";
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

  const open: MatchListItem[] = [];
  const locked: MatchListItem[] = [];
  const settled: MatchListItem[] = [];
  for (const m of matches) {
    if (m.status === "open") open.push(m);
    else if (m.status === "locked" || m.status === "final") locked.push(m);
    else if (m.status === "settled") settled.push(m);
  }

  return (
    <AppShell profile={profile}>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="kicker text-accent">The Fixtures · {ctx.clan.name}</p>
          <h1 className="headline text-3xl sm:text-5xl">Today&apos;s Card</h1>
          <p className="text-sm italic text-ink-soft">
            Place your fake-credit wagers and chase the standings — every call
            goes on the record.
          </p>
          <hr className="rule-thick mt-1" />
        </header>

        <MatchesTabs
          open={open}
          locked={locked}
          settled={settled}
          clanId={clanId}
          currencyName={ctx.clan.currencyName}
        />
      </div>
    </AppShell>
  );
}
