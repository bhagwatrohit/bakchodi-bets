# Bakchodi Bets v2 — Redesign + Fixes Design

**Date:** 2026-06-23
**Status:** Approved-pending-review

## Problem

The live app has six pain points reported by players:

1. The "arcade / CRT" look (neon, pixel fonts, scanlines, glow) reads as gamey, stale, and not enjoyable.
2. Hard to see what's coming up — matches are a flat 3-tab grid with no sense of "what's next."
3. Cumbersome to navigate with many matches (72 group games + a full knockout bracket).
4. People game the system with super-low stakes — there is no minimum bet.
5. Knockout games still offer a "Draw" outcome, which is impossible in knockouts.
6. Matches feel like they lock too early for players in India — a timezone bug, not a lock-timing bug.
7. (Added) Must be mobile-friendly — most players bet from their phones.

## Goals

A single combined pass that:
- Replaces the visual system with a clean, modern, **Robinhood-style dark** aesthetic (with a **Kalshi-style light** variant), defaulting to the device's color scheme and user-switchable.
- Makes upcoming matches obvious and 72+ matches easy to traverse.
- Enforces a minimum bet.
- Removes Draw from knockout matches and auto-loads the knockout bracket.
- Fixes timezone display/entry so locking happens exactly at true kickoff.
- Reworks the leaderboard to rank by net points from completed bets, not credit balance.
- Is mobile-first and responsive throughout.

## Non-goals (YAGNI)

- Live score integration / auto-settlement.
- Per-user stored timezone preference (we use the browser's local timezone).
- Changing the money/settlement engine or auth.

---

## 1. Visual system

Rewrite `app/globals.css` design tokens **keeping existing token names** (`--background`, `--foreground`, `--card`, `--primary`, `--accent`, `--muted`, `--border`, `neon-*` aliases, legacy `ink/paper`) so components re-skin with minimal churn. Where a component hard-codes arcade specifics (e.g. `border-2`, `box-glow`, `glow-*`, `font-pixel`, `stamp`, `blink`), update those usages.

- **Dark = base (`:root`)** — Robinhood: ground `#0c0d10`/near-black, surfaces `#131314`, text `#f5f5f7`, muted `#8b8b90`, hairline borders `#1f1f22`, single green accent `#00c805` (accent-foreground dark green). Rounded corners: `--radius` → `10px` (cards `14px`, pills `999px`).
- **Light = `.light` (Kalshi)** — ground `#f7f8f9`, cards `#ffffff`, text `#11161c`, muted `#6b7480`, borders `#e8ebee`, emerald accent `#00a866`, soft shadow on cards.
- **Typography** — replace Press Start 2P + VT323 with **Inter** (single family, weights 400–800) loaded via `next/font/google` in `layout.tsx`. Tabular numerals for money, times, counts. Drop the arcade type helpers' decoration: `headline`, `kicker`, `matchup`, `dateline`, `stamp`, `glow-*`, `halftone`, `blink`, scanline `body::before`, background grid → redefined as plain, modern equivalents (kept as class names so markup needn't change everywhere; restyled to clean type/weights).
- **Theme behavior** — `ThemeToggle` and the `layout.tsx` no-flash inline script change their default from `dark` to **`system`** (follow `prefers-color-scheme`). Cycle order stays dark → light → system; persisted in `localStorage["bb-theme"]`. Restyle the toggle button (remove neon classes) and the **Sonner toaster** options in `layout.tsx` (currently hard-coded neon green / pixel font → neutral rounded toast that respects the accent).
- **Mobile-first** — base styles target small screens; `sm:`/`md:`/`lg:` progressively enhance. Header/`AppShell` collapses cleanly; tap targets ≥ 44px; no horizontal scroll.

## 2. Match browsing (navigation)

Rebuild the matches experience (`app/clans/[clanId]/matches/page.tsx`, `components/MatchesTabs.tsx`, `components/MatchCard.tsx`) from a flat 3-tab grid into a scannable, **day-grouped list**:

- **Status filter** (pills): **Upcoming · Today · Live · Done** (Upcoming default). "Live" = locked/in-progress (displayStatus `locked`/`final`); "Done" = settled.
- **Date group headers** — matches grouped by local calendar day with sticky-ish headers ("Today · 14 Jun", "Tomorrow", "Sat · 5 Jul · Knockouts"), sorted by kickoff within each day. Knockout days labelled with their round.
- **"Next up"** highlight — the soonest open match gets an accent treatment.
- **Group / round filter** — dropdown to filter by group (A–L) or knockout round.
- **Team search** — text box filtering visible matches by team name.
- **Compact rows** replace big cards: `time · teams (stacked) · group/round · min/max · pot · status · CTA`. Your existing pick shown inline. Far less scrolling for 72+ games. Reuse the same row component for the matches list; keep a richer card only on the match detail page.
- The new filtering/grouping is computed in a client component fed by `listMatches` data (server already returns `displayStatus`, `startsAt`, `marketType`); add `stage`/`group`/`round` fields (see §4) to support grouping/filtering.

## 3. Minimum bet

Mirror the existing max-bet design.

- **Schema** (`lib/db/schema.ts`, new migration):
  - `clans.defaultMinBet numeric not null default '100'`.
  - `clans.defaultMaxBet` default raised `'100'` → `'500'` (range 100–500).
  - `matches.minBet numeric` (nullable per-match override, like `maxBet`).
- **Guard** — new pure function `assertAtLeastMinBet(stake, minBet)` in `lib/services/validation.ts`; throws validation `Bet must be at least {minBet}.`
- **Enforcement** — in `placeBet` (`lib/services/bets.ts`), compute `effectiveMinBet = match.minBet ?? clan.defaultMinBet` and assert; **skipped** for fixed-stake Grand Gala markets.
- **Surfaces** — clan admin settings (`ClanSettingsForm`), create/edit match forms, `BetForm` hint ("Min 100 · Max 500"), and match rows.
- **Types** — extend `MatchListItem`/`MatchDetail` with `minBet`.

## 4. Knockouts: no Draw + auto-loaded bracket

- **Schema** — add `matches.stage text not null default 'group'` with check `in ('group','knockout')`. Optional `matches.round text` (e.g. "Round of 32", "Final") and `matches.groupLabel text` (e.g. "A") to drive grouping/labels; both nullable.
- **Outcome construction** (`lib/services/matches.ts createMatch`) — knockout stage → outcomes `[A, B]` only; group stage → `[A, Draw, B]`. Existing `includeDraw` flag is replaced/derived by stage: group ⇒ draw, knockout ⇒ no draw.
- **Admin form** (`CreateMatchForm`) — replace the "Allow a draw" checkbox with a **Match type: Group / Knockout** segmented control. Knockout also reveals an optional round label.
- **Auto-load the bracket** — extend the seed (`lib/db/seed.ts`) and fixtures so every new clan is pre-loaded with the 2026 knockout bracket as `stage:'knockout'` matches: Round of 32 (16), Round of 16 (8), Quarter-finals (4), Semi-finals (2), third-place (1), Final (1) = **32 matches**, with real kickoff datetimes and **placeholder teams ("TBD")** since matchups aren't known until groups finish. Admins rename teams via the existing editable-match flow once known. Knockout fixtures are added to `scripts/wc2026-fixtures.json` (or a sibling `wc2026-knockouts.json`) with `stage`, `round`, `date`, `kickoff` + venue; existing 72 group fixtures gain `stage:'group'` + `group` label. Settlement is unaffected (it already handles N outcomes and picking a winner).

## 5. Lock exactly at kickoff + timezone correctness

The lock comparison `now.getTime() >= startsAt.getTime()` is already instant-correct (`lib/services/validation.ts`, `matches.ts deriveDisplayStatus`). The real bugs are **display** and **input**:

- **Display** — replace the server-side `formatTime` in `MatchCard` (and any other server-rendered times) with a small **`<LocalTime>` client component** that formats via `Intl.DateTimeFormat` with **no fixed `timeZone`**, so it renders in the viewer's browser timezone. Indian players see IST. Render a stable server fallback (ISO/UTC label) to avoid hydration mismatch, then localize on mount.
- **Admin input** — in `CreateMatchForm`/edit-match, convert the `datetime-local` string to a true instant **on the client** (the admin's browser timezone) before submit — submit `new Date(localValue).toISOString()` instead of the bare local string. Server stores the correct instant. This fixes "locks too soon" for matches created by an admin in a different timezone than the server.
- **No early buffer** — confirm there is no pre-kickoff buffer anywhere; lock fires exactly at `startsAt`. Keep `lockBetsAtMatchStart` semantics.
- **Fixtures sanity** — verify seeded fixtures resolve to correct UTC instants (group fixtures use `-04:00` ET; knockout fixtures get explicit offsets for their venues). Flag any venue not actually in US Eastern.

## 6. Leaderboard — rank by points from completed bets

Today the leaderboard ranks by current **credit balance** and shows `netChange = balance − startingBalance`. Balance is a poor performance measure: it includes the untouched starting pile, credits locked in *pending* bets, and admin adjustments. Switch the leaderboard to reflect **only completed (settled) bets**.

- **Primary metric — Net points** = `Σ profit` over each member's **settled** bets (`status in ('won','lost','void')`; won = positive parimutuel profit, lost = `−stake`, void = 0). This is winnings **minus** losses, so disciplined bettors outrank high-volume ones. Pending bets contribute nothing until settled.
- **Ranking** — order by net points desc (tie-break by wins, then fewest bets). Replaces the balance-based sort in `getLeaderboard` (`lib/services/bets.ts`).
- **Columns** (`LeaderboardTable`) — headline **Points** (net, green/red, `+` prefix), then Bets · Wins · Losses · Biggest win, and **current credits as a small muted secondary column** for reference (no longer the ranking key). Drop the old "Net change" column (superseded by Points).
- **Types** — add `netPoints` to `LeaderboardRow`; keep `balance` for the secondary column. Compute `netPoints` in the existing per-member stats query (`sum(profit) filter (where status in ('won','lost','void'))`).
- Empty/zero state: members with no settled bets show `0` points and sort below anyone with a positive score.

## Files touched (indicative)

- `app/globals.css`, `app/layout.tsx`, `components/ThemeToggle.tsx` — visual system + theme default + toaster.
- `app/clans/[clanId]/matches/page.tsx`, `components/MatchesTabs.tsx`, `components/MatchCard.tsx`, new `components/LocalTime.tsx`, new match-row + filter components — browsing.
- `lib/db/schema.ts` + new migration, `lib/db/seed.ts`, `scripts/wc2026-fixtures.json` (+ knockouts) — min bet, stage, bracket.
- `lib/services/validation.ts`, `lib/services/bets.ts`, `lib/services/matches.ts`, `lib/types.ts` — min bet + stage logic + leaderboard net-points metric.
- `components/LeaderboardTable.tsx` — points-based columns.
- `components/admin/CreateMatchForm.tsx`, `components/admin/ClanSettingsForm.tsx`, `app/actions/admin.ts`, `app/actions/bets.ts`, `components/BetForm.tsx` — admin/bet UI.
- Every component still using arcade classes (`Card`, `Button`, `badge`, `tabs`, `table`, `LeaderboardTable`, `BetHistoryTable`, `ClanCard`, `Trophy`, `Flag`, etc.) — restyle pass.

## Testing

- Unit: add `assertAtLeastMinBet` tests, knockout-vs-group outcome construction tests, and a leaderboard net-points/ranking test (settled bets only, pending excluded) alongside `tests/settlement.test.ts`.
- `npm run typecheck`, `npm run lint`, `npm run test`.
- Manual: place-bet below min (rejected), knockout match has no Draw, kickoff renders in local tz, match locks exactly at start, responsive check at mobile widths, theme follows device + toggles.

## Risks / notes

- **Wide restyle blast radius** — many components reference arcade utility classes. Mitigate by keeping token *names* and redefining the type-helper classes, so most markup is untouched; do a component-by-component sweep.
- **Knockout matchups are TBD** — placeholder teams until groups finish; relies on the existing editable-match feature. Acceptable.
- **Migration** — adding columns with defaults is safe; existing rows backfill (`stage='group'`, `minBet=null`). `defaultMaxBet` default change only affects new clans; document that existing clans keep their current value unless an admin updates it.
- **Hydration** — `LocalTime` must render a deterministic server value then localize on mount to avoid React hydration warnings.
