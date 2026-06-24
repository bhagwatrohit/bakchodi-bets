import fixturesData from "@/scripts/wc2026-fixtures.json";
import knockoutsData from "@/scripts/wc2026-knockouts.json";

/*
  The real 2026 FIFA World Cup fixtures, imported (not fs-read) so they're
  bundled into the server build and available on Vercel. Used to pre-load every
  new clan with the full match card: 72 group games + the 32-match knockout
  bracket (matchups TBD until the group stage finishes).
*/

export interface WcFixture {
  group: string;
  date: string; // YYYY-MM-DD
  kickoff_et: string; // HH:MM, US Eastern
  venue: string;
  team_a: string;
  team_b: string;
}

export interface WcKnockout {
  round: string; // "Round of 32" … "Final"
  match_no: number;
  date: string; // YYYY-MM-DD
  kickoff_et: string; // HH:MM, US Eastern
  venue: string;
  team_a: string; // "TBD" until known
  team_b: string;
}

export const WORLD_CUP_FIXTURES: WcFixture[] = (
  fixturesData as { matches: WcFixture[] }
).matches;

export const WORLD_CUP_KNOCKOUTS: WcKnockout[] = (
  knockoutsData as { matches: WcKnockout[] }
).matches;

/** Kickoff instant — fixtures are in US Eastern (EDT, UTC-4 in June/July). */
export function fixtureStartsAt(f: { date: string; kickoff_et: string }): Date {
  return new Date(`${f.date}T${f.kickoff_et}:00-04:00`);
}

/* ----------------------- Grand Gala (tournament winner) ----------------------- */

/** All 48 teams, de-duped + alphabetical — the Grand Gala outcomes. */
export const WORLD_CUP_TEAMS: string[] = Array.from(
  new Set(WORLD_CUP_FIXTURES.flatMap((f) => [f.team_a, f.team_b])),
).sort((a, b) => a.localeCompare(b));

export const GRAND_GALA_TITLE = "World Cup Winner";

/**
 * Grand Gala locks when the knockouts begin. Group stage ends Jun 27, 2026;
 * Round of 32 starts ~Jun 28. Betting on the champion is open until then.
 */
export function grandGalaLockAt(): Date {
  return new Date("2026-06-28T12:00:00-04:00");
}
