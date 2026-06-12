import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag } from "@/components/Flag";
import {
  getWorldCupNews,
  getWorldCupOdds,
  newsForTeams,
  oddsViewFor,
  type MatchOddsView,
  type WcNewsItem,
} from "@/lib/services/worldcup-feed";
import { upcomingOpenMatchesByClan, type ClanUpcomingMatch } from "@/lib/services/matches";

/*
  "World Cup Wire" — live news + bookmaker odds panels, one per clan, scoped
  to the teams in that clan's upcoming matches. Server components; the ESPN
  fetches are memoized per render pass, so many panels cost one request.
*/

function formatKickoff(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function formatPublished(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

function OddsLine({ matchup, odds }: { matchup: ClanUpcomingMatch; odds: MatchOddsView | null }) {
  return (
    <li className="flex flex-col gap-1 border-b border-hairline pb-2 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <Flag team={matchup.teamA} size="sm" />
          <span className="matchup truncate text-base">
            {matchup.teamA} vs {matchup.teamB}
          </span>
          <Flag team={matchup.teamB} size="sm" />
        </span>
        <span className="dateline shrink-0">{formatKickoff(matchup.startsAt)}</span>
      </div>
      {odds ? (
        <p className="tabular text-xs text-muted-foreground">
          {odds.a && odds.b ? (
            <>
              <span className="text-neon-green">{matchup.teamA} {odds.a}</span>
              {odds.draw ? <span> · Draw {odds.draw}</span> : null}
              <span> · {matchup.teamB} {odds.b}</span>
            </>
          ) : (
            <span>{odds.summary}</span>
          )}
          {odds.provider ? <span className="text-muted-foreground/70"> · {odds.provider}</span> : null}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground/70">Lines pending</p>
      )}
    </li>
  );
}

function Headline({ item }: { item: WcNewsItem }) {
  const date = formatPublished(item.published);
  const body = (
    <>
      <span className="block text-sm leading-snug text-phosphor">{item.headline}</span>
      {date ? <span className="dateline mt-0.5 block">{date}</span> : null}
    </>
  );
  return (
    <li className="border-b border-hairline pb-2 last:border-b-0 last:pb-0">
      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-colors hover:text-accent"
        >
          {body}
        </a>
      ) : (
        body
      )}
    </li>
  );
}

/** News + odds panel for one clan, scoped to its upcoming matches. */
export async function ClanWire({
  clanId,
  clanName,
  matches,
  headlineCount = 3,
}: {
  clanId: string;
  clanName?: string;
  matches: ClanUpcomingMatch[];
  headlineCount?: number;
}) {
  const [news, odds] = await Promise.all([getWorldCupNews(), getWorldCupOdds()]);

  if (news === null && odds === null) {
    return (
      <Card>
        <CardHeader>
          {clanName ? <p className="kicker">{clanName}</p> : null}
          <CardTitle>World Cup Wire</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Wire&apos;s down — news and odds will be back once the feed is reachable.
          </p>
        </CardContent>
      </Card>
    );
  }

  const teams = Array.from(new Set(matches.flatMap((m) => [m.teamA, m.teamB])));
  const headlines = news ? newsForTeams(news, teams, headlineCount) : [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          {clanName ? <p className="kicker">{clanName}</p> : null}
          <CardTitle>World Cup Wire</CardTitle>
        </div>
        <Link
          href={`/clans/${clanId}/matches`}
          className="font-pixel uppercase tracking-widest text-[0.55rem] text-neon-cyan hover:glow-cyan"
        >
          Matches →
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {matches.length ? (
          <div>
            <p className="kicker mb-2 text-neon-amber">The Lines</p>
            <ul className="flex flex-col gap-2">
              {matches.map((m) => (
                <OddsLine
                  key={m.matchId}
                  matchup={m}
                  odds={odds ? oddsViewFor(odds, m.teamA, m.teamB) : null}
                />
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <p className="kicker mb-2 text-neon-magenta">The Wire</p>
          {headlines.length ? (
            <ul className="flex flex-col gap-2">
              {headlines.map((item, i) => (
                <Headline key={item.url ?? `${i}-${item.headline}`} item={item} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No fresh stories on the wire.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Dashboard section: one wire panel per clan the user plays in. */
export async function DashboardWire({
  clans,
}: {
  clans: { clanId: string; name: string }[];
}) {
  if (clans.length === 0) return null;
  const upcoming = await upcomingOpenMatchesByClan(3);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="kicker">Hot Off The Wire</p>
        <h2 className="headline mt-1 text-xl sm:text-2xl">News &amp; Odds</h2>
        <hr className="rule-thick mt-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clans.map((clan) => (
          <ClanWire
            key={clan.clanId}
            clanId={clan.clanId}
            clanName={clan.name}
            matches={upcoming.get(clan.clanId) ?? []}
          />
        ))}
      </div>
    </section>
  );
}

export function WireSkeleton() {
  return (
    <div className="border-2 border-dashed border-grid px-4 py-8 text-center">
      <p className="kicker text-neon-cyan blink">Dialing the wire…</p>
    </div>
  );
}
