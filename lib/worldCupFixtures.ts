import fixturesData from "@/scripts/wc2026-fixtures.json";

/*
  The real 2026 FIFA World Cup group-stage fixtures, imported (not fs-read) so
  they're bundled into the server build and available on Vercel. Used to
  pre-load every new clan with the full match card.
*/

export interface WcFixture {
  group: string;
  date: string; // YYYY-MM-DD
  kickoff_et: string; // HH:MM, US Eastern
  venue: string;
  team_a: string;
  team_b: string;
}

export const WORLD_CUP_FIXTURES: WcFixture[] = (
  fixturesData as { matches: WcFixture[] }
).matches;

/** Kickoff instant — fixtures are in US Eastern (EDT, UTC-4 in June/July). */
export function fixtureStartsAt(f: WcFixture): Date {
  return new Date(`${f.date}T${f.kickoff_et}:00-04:00`);
}
