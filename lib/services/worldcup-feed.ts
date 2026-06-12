import "server-only";
import { WORLD_CUP_TEAMS } from "@/lib/worldCupFixtures";
import type { MatchOddsView } from "@/lib/types";

/*
  Live World Cup news + betting odds, pulled from ESPN's public site API
  (no key required). Everything here is best-effort: the feeds are parsed
  defensively and a network/shape failure returns null so the UI can show a
  quiet "wire offline" state instead of breaking the page. Responses are
  cached through Next's fetch data cache (news 15 min, odds 5 min), and
  fetch memoization dedupes calls when several panels render at once.
*/

const NEWS_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/news?limit=50";
const SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

export interface WcNewsItem {
  headline: string;
  description: string | null;
  url: string | null;
  published: string | null; // ISO timestamp
  /** Fixture team names (our naming) mentioned in the headline/description. */
  teams: string[];
}

export interface WcOddsEntry {
  /** Normalized team names (see normalizeTeam). */
  home: string;
  away: string;
  homeLine: number | null; // American moneyline
  awayLine: number | null;
  drawLine: number | null;
  details: string | null; // bookmaker summary string, e.g. "MEX -150"
  provider: string | null;
}

export type { MatchOddsView };

/* ------------------------------ team matching ------------------------------ */

// Feed spellings → our fixture names (both sides normalized).
const TEAM_ALIASES: Record<string, string> = {
  usa: "united states",
  "united states of america": "united states",
  "cote d'ivoire": "ivory coast",
  "czech republic": "czechia",
  turkiye: "turkey",
  "korea republic": "south korea",
  "republic of korea": "south korea",
  "dr congo": "congo dr",
  "democratic republic of the congo": "congo dr",
  "cabo verde": "cape verde",
  "ir iran": "iran",
  "bosnia-herzegovina": "bosnia and herzegovina",
  "bosnia & herzegovina": "bosnia and herzegovina",
};

/** Lowercase, strip diacritics, collapse whitespace, resolve known aliases. */
export function normalizeTeam(name: string): string {
  const flat = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return TEAM_ALIASES[flat] ?? flat;
}

// [pattern, fixture name] pairs for spotting teams in article text.
const TEAM_PATTERNS: [RegExp, string][] = (() => {
  const variants = new Map<string, string>(); // searched spelling -> fixture name
  for (const team of WORLD_CUP_TEAMS) variants.set(team.toLowerCase(), team);
  for (const [alias, canonical] of Object.entries(TEAM_ALIASES)) {
    const fixture = WORLD_CUP_TEAMS.find((t) => normalizeTeam(t) === canonical);
    if (fixture) variants.set(alias, fixture);
  }
  return Array.from(variants.entries()).map(([spelling, fixture]) => [
    new RegExp(`\\b${spelling.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"),
    fixture,
  ]);
})();

function teamsMentioned(text: string): string[] {
  const flat = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const found = new Set<string>();
  for (const [pattern, fixture] of TEAM_PATTERNS) {
    if (pattern.test(flat)) found.add(fixture);
  }
  return Array.from(found);
}

/* ------------------------------ JSON helpers ------------------------------ */

type J = Record<string, unknown>;
const obj = (v: unknown): J | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as J) : null;
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

async function fetchJson(url: string, revalidate: number): Promise<J | null> {
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    return obj(await res.json());
  } catch {
    return null;
  }
}

/* --------------------------------- news --------------------------------- */

/** Latest World Cup headlines, or null if the feed is unreachable. */
export async function getWorldCupNews(): Promise<WcNewsItem[] | null> {
  const data = await fetchJson(NEWS_URL, 900);
  if (!data) return null;

  const items: WcNewsItem[] = [];
  for (const raw of arr(data.articles)) {
    const article = obj(raw);
    if (!article) continue;
    const headline = str(article.headline);
    if (!headline) continue;
    const description = str(article.description);
    const links = obj(article.links);
    const web = links ? obj(links.web) : null;
    items.push({
      headline,
      description,
      url: web ? str(web.href) : null,
      published: str(article.published),
      teams: teamsMentioned(`${headline} ${description ?? ""}`),
    });
  }
  return items;
}

/**
 * Headlines mentioning any of the given teams, padded with general World Cup
 * news if there aren't enough team-specific stories.
 */
export function newsForTeams(
  news: WcNewsItem[],
  teams: string[],
  limit: number,
): WcNewsItem[] {
  const wanted = new Set(teams);
  const matched = news.filter((n) => n.teams.some((t) => wanted.has(t)));
  const padding = news.filter((n) => !matched.includes(n));
  return [...matched, ...padding].slice(0, limit);
}

/* --------------------------------- odds --------------------------------- */

/** Bookmaker odds for matches in the next week, or null if unreachable. */
export async function getWorldCupOdds(): Promise<WcOddsEntry[] | null> {
  const yyyymmdd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const now = Date.now();
  const from = yyyymmdd(new Date(now - 1 * 86400_000));
  const to = yyyymmdd(new Date(now + 7 * 86400_000));
  const data = await fetchJson(`${SCOREBOARD_URL}?dates=${from}-${to}&limit=100`, 300);
  if (!data) return null;

  const entries: WcOddsEntry[] = [];
  for (const rawEvent of arr(data.events)) {
    const event = obj(rawEvent);
    const competition = event ? obj(arr(event.competitions)[0]) : null;
    if (!competition) continue;

    let home: string | null = null;
    let away: string | null = null;
    for (const rawSide of arr(competition.competitors)) {
      const side = obj(rawSide);
      const team = side ? obj(side.team) : null;
      const name = team ? (str(team.displayName) ?? str(team.name)) : null;
      if (!side || !name) continue;
      if (side.homeAway === "home") home = name;
      else if (side.homeAway === "away") away = name;
    }
    if (!home || !away) continue;

    const odds = obj(arr(competition.odds)[0]);
    if (!odds) continue;
    const provider = obj(odds.provider);
    const moneyLineOf = (v: unknown) => {
      const side = obj(v);
      return side ? num(side.moneyLine) : null;
    };
    entries.push({
      home: normalizeTeam(home),
      away: normalizeTeam(away),
      homeLine: moneyLineOf(odds.homeTeamOdds),
      awayLine: moneyLineOf(odds.awayTeamOdds),
      drawLine: moneyLineOf(odds.drawOdds),
      details: str(odds.details),
      provider: provider ? str(provider.name) : null,
    });
  }
  return entries;
}

function fmtLine(line: number | null): string | null {
  if (line === null) return null;
  return line > 0 ? `+${line}` : `${line}`;
}

/** Display odds for a fixture, matching teams regardless of home/away order. */
export function oddsViewFor(
  entries: WcOddsEntry[],
  teamA: string,
  teamB: string,
): MatchOddsView | null {
  const a = normalizeTeam(teamA);
  const b = normalizeTeam(teamB);
  const entry = entries.find(
    (e) =>
      (e.home === a && e.away === b) || (e.home === b && e.away === a),
  );
  if (!entry) return null;
  const aIsHome = entry.home === a;
  const view: MatchOddsView = {
    a: fmtLine(aIsHome ? entry.homeLine : entry.awayLine),
    draw: fmtLine(entry.drawLine),
    b: fmtLine(aIsHome ? entry.awayLine : entry.homeLine),
    summary: entry.details,
    provider: entry.provider,
  };
  if (!view.a && !view.b && !view.summary) return null;
  return view;
}
