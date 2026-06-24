# Bakchodi Bets v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the arcade theme with a clean Robinhood/Kalshi look, make matches easy to browse on mobile, add a minimum bet, remove Draw from knockouts (auto-loading the bracket), fix timezone-correct locking, and rank the leaderboard by net points from completed bets.

**Architecture:** Next.js 16 App Router + Server Actions + Drizzle/Postgres. Logic lives in `lib/services/*` (pure guards in `validation.ts`, unit-tested). UI is server components feeding client components. Theming is CSS custom properties on `:root` (dark) / `.light`, toggled by a class. Money is `decimal.js`-backed strings — never floats.

**Tech Stack:** Next 16.2, React 19, Tailwind v4, Drizzle ORM, Postgres, Vitest, Inter (next/font), lucide-react, sonner.

## Global Constraints

- Money values are `numeric` strings via `lib/money.ts` helpers (`add`, `sub`, `cmp`, `mul`, `div`, `parseMoney`) — never JS floats.
- Read `node_modules/next/dist/docs/` before using unfamiliar Next 16 APIs (per AGENTS.md — this is not stock Next).
- Keep CSS design-token *names* (`--background`, `--foreground`, `--card`, `--primary`, `--accent`, `--muted`, `--border`, `--neon-*` aliases, `--ink/--paper`) so components re-skin without markup churn.
- Default min bet `100`, default max bet `500`. Grand Gala (fixed-stake) markets skip min/max checks.
- Theme default = `system`; persisted in `localStorage["bb-theme"]`; no flash on load.
- Mobile-first: base styles target phones; tap targets ≥44px; no horizontal scroll.
- Deploy = push to `main` → Vercel. Prod DB migration must be applied separately.

---

## Phase A — Data model & logic (TDD)

### Task 1: Schema migration — min bet, max-bet default, stage/round

**Files:**
- Modify: `lib/db/schema.ts` (clans + matches tables)
- Generate: `lib/db/migrations/*` via `npm run db:generate`

- [ ] **Step 1: Edit `clans` table** — add `defaultMinBet` and raise default max:
```ts
startingBalance: numeric("starting_balance", { mode: "string" }).notNull().default("1000"),
defaultMinBet: numeric("default_min_bet", { mode: "string" }).notNull().default("100"),
defaultMaxBet: numeric("default_max_bet", { mode: "string" }).notNull().default("500"),
```

- [ ] **Step 2: Edit `matches` table** — add per-match min + stage/round/group:
```ts
maxBet: numeric("max_bet", { mode: "string" }),
minBet: numeric("min_bet", { mode: "string" }),
stage: text("stage").notNull().default("group"),
round: text("round"),
groupLabel: text("group_label"),
```
And add to the `matches` table's check list:
```ts
check("matches_stage_chk", sql`${t.stage} in ('group','knockout')`),
```

- [ ] **Step 3: Generate migration** — `npm run db:generate`; confirm a new file appears in `lib/db/migrations/`.

- [ ] **Step 4: Apply locally** — `npm run db:up` (if needed) then `npm run db:migrate`; expect success, no errors.

- [ ] **Step 5: Commit** — `git add lib/db/schema.ts lib/db/migrations && git commit -m "feat(db): add min bet, stage/round columns; raise default max to 500"`

### Task 2: Minimum-bet guard (TDD)

**Files:**
- Modify: `lib/services/validation.ts`
- Modify: `lib/services/bets.ts` (enforce in `placeBet`)
- Test: `tests/validation.test.ts` (new)

**Interfaces:**
- Produces: `assertAtLeastMinBet(stake: Money, minBet: Money): void` — throws `validation` when `cmp(stake, minBet) < 0`.

- [ ] **Step 1: Write failing test** in `tests/validation.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { assertAtLeastMinBet, assertWithinMaxBet } from "@/lib/services/validation";
import { ServiceError } from "@/lib/errors";

describe("assertAtLeastMinBet", () => {
  it("passes when stake equals the minimum", () => {
    expect(() => assertAtLeastMinBet("100", "100")).not.toThrow();
  });
  it("passes when stake exceeds the minimum", () => {
    expect(() => assertAtLeastMinBet("250", "100")).not.toThrow();
  });
  it("throws when stake is below the minimum", () => {
    expect(() => assertAtLeastMinBet("50", "100")).toThrow(ServiceError);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL** — `npm run test -- validation` → fails (export missing).

- [ ] **Step 3: Implement guard** in `lib/services/validation.ts`:
```ts
/** Stake must be at least the effective minimum bet. */
export function assertAtLeastMinBet(stake: Money, minBet: Money): void {
  if (cmp(stake, minBet) < 0) {
    throw validation(`Bet must be at least ${minBet}.`);
  }
}
```

- [ ] **Step 4: Run test, expect PASS** — `npm run test -- validation`.

- [ ] **Step 5: Enforce in `placeBet`** (`lib/services/bets.ts`), in the non-fixed-stake branch alongside `assertWithinMaxBet`:
```ts
if (match.fixedStake == null) {
  const effectiveMaxBet: Money = match.maxBet ?? clan.defaultMaxBet;
  const effectiveMinBet: Money = match.minBet ?? clan.defaultMinBet;
  assertAtLeastMinBet(stake, effectiveMinBet);
  assertWithinMaxBet(stake, effectiveMaxBet);
}
```
Add `assertAtLeastMinBet` to the import from `@/lib/services/validation`.

- [ ] **Step 6: Run full tests + typecheck** — `npm run test && npm run typecheck`.

- [ ] **Step 7: Commit** — `git commit -am "feat(bets): enforce minimum bet"`

### Task 3: Knockout outcomes — no Draw (TDD)

**Files:**
- Modify: `lib/services/matches.ts` (`createMatch` signature + outcome construction)
- Modify: `app/actions/admin.ts` (`createMatchAction` reads `stage`)
- Test: `tests/matches-outcomes.test.ts` (new — pure helper)

**Interfaces:**
- Produces: `buildOutcomeLabels(opts: { labelA: string; labelB: string; stage: "group" | "knockout" }): string[]` exported from `lib/services/matches.ts` — returns `[A, "Draw", B]` for group, `[A, B]` for knockout.

- [ ] **Step 1: Write failing test** `tests/matches-outcomes.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildOutcomeLabels } from "@/lib/services/matches";

describe("buildOutcomeLabels", () => {
  it("group stage includes a Draw between the teams", () => {
    expect(buildOutcomeLabels({ labelA: "India", labelB: "Pakistan", stage: "group" }))
      .toEqual(["India", "Draw", "Pakistan"]);
  });
  it("knockout stage has no Draw", () => {
    expect(buildOutcomeLabels({ labelA: "France", labelB: "Spain", stage: "knockout" }))
      .toEqual(["France", "Spain"]);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL.**

- [ ] **Step 3: Implement + refactor `createMatch`.** Add exported helper and use it; replace `includeDraw` param with `stage`:
```ts
export function buildOutcomeLabels(opts: {
  labelA: string; labelB: string; stage: "group" | "knockout";
}): string[] {
  return opts.stage === "knockout"
    ? [opts.labelA, opts.labelB]
    : [opts.labelA, "Draw", opts.labelB];
}
```
In `createMatch`, change the input type `includeDraw: boolean` → `stage: "group" | "knockout"; round?: string`, persist `stage`/`round`, and build outcomes:
```ts
const labels = buildOutcomeLabels({ labelA, labelB, stage: input.stage });
const outcomeValues = labels.map((label, i) => ({ matchId: match.id, label, sortOrder: i }));
```
Persist `stage: input.stage, round: input.round ?? null` in the match insert.

- [ ] **Step 4: Update `createMatchAction`** (`app/actions/admin.ts`) to read `stage` (`fd.get("stage") === "knockout" ? "knockout" : "group"`) and `round`, dropping `includeDraw`.

- [ ] **Step 5: Run tests + typecheck, expect PASS.**

- [ ] **Step 6: Commit** — `git commit -am "feat(matches): knockout stage removes Draw outcome"`

### Task 4: Leaderboard — net points from completed bets (TDD)

**Files:**
- Modify: `lib/services/bets.ts` (`getLeaderboard`)
- Modify: `lib/types.ts` (`LeaderboardRow` adds `netPoints`)
- Test: `tests/leaderboard.test.ts` (new — pure ranking helper)

**Interfaces:**
- Produces: `rankLeaderboard(rows: Array<Omit<LeaderboardRow,"rank">>): LeaderboardRow[]` exported from `lib/services/bets.ts` — sorts by `netPoints` desc, tie-break `wins` desc then `betsPlaced` asc, assigns `rank`.

- [ ] **Step 1: Add `netPoints: string` to `LeaderboardRow`** in `lib/types.ts`.

- [ ] **Step 2: Write failing test** `tests/leaderboard.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { rankLeaderboard } from "@/lib/services/bets";

const base = { displayName: "x", balance: "1000", betsPlaced: 0, wins: 0, losses: 0, biggestWin: "0", isMe: false };

describe("rankLeaderboard", () => {
  it("ranks by net points, not balance", () => {
    const out = rankLeaderboard([
      { ...base, userId: "a", netPoints: "100", balance: "900" },
      { ...base, userId: "b", netPoints: "400", balance: "800" },
    ]);
    expect(out.map((r) => r.userId)).toEqual(["b", "a"]);
    expect(out[0].rank).toBe(1);
  });
  it("breaks ties by wins then fewer bets", () => {
    const out = rankLeaderboard([
      { ...base, userId: "a", netPoints: "50", wins: 1, betsPlaced: 5 },
      { ...base, userId: "b", netPoints: "50", wins: 1, betsPlaced: 2 },
    ]);
    expect(out.map((r) => r.userId)).toEqual(["b", "a"]);
  });
});
```

- [ ] **Step 3: Run test, expect FAIL.**

- [ ] **Step 4: Implement `rankLeaderboard`** in `lib/services/bets.ts` and add `netPoints` to the per-member stats query (`sum(profit) filter (where status in ('won','lost','void'))::text` defaulting to `0`). Replace the old `rows.sort(balance)` + `map(rank)` tail of `getLeaderboard` with `return rankLeaderboard(rows);`. Drop `netChange` from the row build (column removed in UI). Sort helper:
```ts
export function rankLeaderboard(
  rows: Array<Omit<LeaderboardRow, "rank">>,
): LeaderboardRow[] {
  const sorted = [...rows].sort((a, b) => {
    const byPoints = cmp(b.netPoints, a.netPoints);
    if (byPoints !== 0) return byPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.betsPlaced - b.betsPlaced;
  });
  return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
}
```
Remove `netChange` from `LeaderboardRow` in `lib/types.ts` if present, or keep `balance` only.

- [ ] **Step 5: Run tests + typecheck, expect PASS.**

- [ ] **Step 6: Commit** — `git commit -am "feat(leaderboard): rank by net points from completed bets"`

### Task 5: Knockout bracket fixtures + seed

**Files:**
- Create: `scripts/wc2026-knockouts.json` (32 knockout fixtures)
- Modify: `scripts/wc2026-fixtures.json` (add `"stage":"group"` + `"group"` to each — optional if seed sets it)
- Modify: `lib/worldCupFixtures.ts` (load knockouts; export with stage/round)
- Modify: `lib/db/seed.ts` (seed knockout matches as `stage:'knockout'`, no Draw)

- [ ] **Step 1: Create `scripts/wc2026-knockouts.json`** — 32 entries (R32×16, R16×8, QF×4, SF×2, third-place×1, final×1) with real 2026 dates/venues and ISO kickoff with explicit UTC offset, `team_a`/`team_b` = `"TBD"`, plus `round` (e.g. `"Round of 32"`) and `stage: "knockout"`. Use the official FIFA 2026 knockout schedule (Jun 28–Jul 19, 2026).

- [ ] **Step 2: Extend `lib/worldCupFixtures.ts`** — import knockouts, add `stage`/`round` to the `WcFixture` interface, export `WORLD_CUP_KNOCKOUTS` and a combined accessor. Keep `fixtureStartsAt` working for both (knockouts carry their own offset).

- [ ] **Step 3: Update `lib/db/seed.ts`** — after seeding group matches (now with `stage:'group'`, `groupLabel`), loop knockout fixtures inserting matches with `stage:'knockout'`, `round`, outcomes `[team_a, team_b]` (no Draw via `buildOutcomeLabels`). Update the summary log count.

- [ ] **Step 4: Re-seed locally** — `npm run db:seed`; verify counts (72 group + 32 knockout + gala + demo) and that a knockout match has exactly 2 outcomes.

- [ ] **Step 5: Commit** — `git commit -am "feat(seed): auto-load 2026 knockout bracket (no Draw)"`

---

## Phase B — Timezone correctness

### Task 6: `<LocalTime>` — render kickoff in the viewer's timezone

**Files:**
- Create: `components/LocalTime.tsx`
- Modify: `components/MatchCard.tsx` (+ any other server-rendered match times: match detail page, dashboard)

- [ ] **Step 1: Create `components/LocalTime.tsx`** (client component, hydration-safe):
```tsx
"use client";
import { useEffect, useState } from "react";

/** Renders an instant in the viewer's local timezone. Server paints a stable
 *  UTC label; the browser swaps to local time after mount (no hydration drift). */
export function LocalTime({
  value, dateStyle = "medium", timeStyle = "short", className,
}: {
  value: Date | string;
  dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
  timeStyle?: Intl.DateTimeFormatOptions["timeStyle"];
  className?: string;
}) {
  const iso = typeof value === "string" ? value : value.toISOString();
  const [text, setText] = useState(() =>
    new Intl.DateTimeFormat("en-US", { dateStyle, timeStyle, timeZone: "UTC" }).format(new Date(iso)) + " UTC",
  );
  useEffect(() => {
    setText(new Intl.DateTimeFormat(undefined, { dateStyle, timeStyle }).format(new Date(iso)));
  }, [iso, dateStyle, timeStyle]);
  return <time dateTime={iso} className={className} suppressHydrationWarning>{text}</time>;
}
```

- [ ] **Step 2: Replace `formatTime`** in `MatchCard.tsx` with `<LocalTime value={match.startsAt} />`; remove the local `formatTime` helper. Do the same anywhere else kickoff is server-formatted (match detail page header).

- [ ] **Step 3: Verify** — `npm run typecheck`; manual: a match time shows local tz after load.

- [ ] **Step 4: Commit** — `git commit -am "fix(tz): render kickoff times in viewer local timezone"`

### Task 7: Admin kickoff input → true instant (client-side)

**Files:**
- Modify: `components/admin/CreateMatchForm.tsx` (+ edit-match form if separate)

- [ ] **Step 1: Convert `datetime-local` to ISO on submit.** Add a hidden field populated from the local input via `new Date(localValue).toISOString()` (parses in the admin's browser tz), and submit that as `startsAt`. Add a small caption under the field: "Times are in your device's timezone." Keep `createMatch` parsing `new Date(iso)` — now receiving a correct instant.

- [ ] **Step 2: Verify** — typecheck; manual: create a match at a local time, confirm the stored/displayed instant matches the intended local kickoff.

- [ ] **Step 3: Commit** — `git commit -am "fix(tz): store admin kickoff as a real instant in their timezone"`

---

## Phase C — Visual system (Robinhood dark / Kalshi light)

### Task 8: Design tokens + fonts + theme default + toaster

**Files:**
- Modify: `app/globals.css` (full token + helper rewrite)
- Modify: `app/layout.tsx` (Inter font, no-flash default `system`, toaster styles, metadata)
- Modify: `components/ThemeToggle.tsx` (default `system`, restyle button)

- [ ] **Step 1: Rewrite `:root` (dark base) + `html.light` token values** per the spec palette (dark `#0c0d10`/`#131314`/`#f5f5f7`/`#8b8b90`/`#1f1f22`, accent `#00c805`; light `#f7f8f9`/`#fff`/`#11161c`/`#6b7480`/`#e8ebee`, accent `#00a866`). Set `--radius: 10px`. Remap legacy/`neon-*` aliases to the new palette so existing utility classes resolve sanely.
- [ ] **Step 2: Replace decorative helpers** — strip `body::before` scanlines, background grid, `glow-*`, `box-glow`, `blink`, `halftone`, `.stamp` shadow, pixel `headline/kicker/matchup/dateline`. Redefine those class names as clean modern equivalents (weights/sizes/letter-spacing, no glow) so existing markup still styles correctly. `html { font-size: 16px }`.
- [ ] **Step 3: `layout.tsx`** — swap `Press_Start_2P`/`VT323` for `Inter` (`--font-inter`), set `font-display`/`font-condensed`/`font-sans` to Inter in `globals.css @theme`. Change the no-flash script default `'dark'` → `'system'`. Restyle Sonner `<Toaster>` (rounded, neutral surface, accent border, Inter). Update `metadata.title`/`description` (drop "Arcade").
- [ ] **Step 4: `ThemeToggle.tsx`** — initial `useState<Mode>("system")` and stored default `"system"`; restyle button to neutral (`border border-border rounded-md text-muted-foreground hover:bg-muted`).
- [ ] **Step 5: Verify** — `npm run dev`, load a page: dark by default on a dark device, light on a light device, toggle cycles, no flash.
- [ ] **Step 6: Commit** — `git commit -am "feat(ui): Robinhood/Kalshi design tokens, Inter, system theme default"`

### Task 9: Restyle UI primitives

**Files:** `components/ui/{button,card,badge,tabs,table,input,label}.tsx`

- [ ] **Step 1:** Update each primitive's variants to the new tokens: rounded corners (`rounded-md`/`rounded-lg`/`rounded-full`), `border` (1px, not `border-2`), accent-filled primary button (`bg-primary text-primary-foreground`), ghost/outline variants, focus ring `ring-ring`. Remove uppercase/letter-spacing/glow. Ensure ≥44px tap targets on buttons/inputs.
- [ ] **Step 2: Verify** — typecheck; spot-check a page renders cleanly.
- [ ] **Step 3: Commit** — `git commit -am "feat(ui): restyle primitives for clean theme"`

### Task 10: Match browsing — day-grouped, filters, search, rows

**Files:**
- Create: `components/MatchBrowser.tsx` (client: status filter + group/round filter + search + day grouping + "Next up")
- Create: `components/MatchRow.tsx` (compact row)
- Modify: `components/MatchesTabs.tsx` (replace with MatchBrowser or delete), `app/clans/[clanId]/matches/page.tsx`, `lib/types.ts` (`MatchListItem` gains `stage`, `round`, `groupLabel`, `minBet`), `lib/services/matches.ts` (`buildListItem` returns them)

- [ ] **Step 1:** Extend `MatchListItem` + `buildListItem` with `stage`, `round`, `groupLabel`, `minBet`.
- [ ] **Step 2:** Build `MatchRow` — `time (LocalTime) · stacked teams w/ Flag · group/round · Min/Max · pot · status chip · CTA`; "Next up" accent prop; inline existing pick.
- [ ] **Step 3:** Build `MatchBrowser` — props: `matches`, `clanId`, `currencyName`. Status pills (Upcoming default = open & future; Today = open & today local; Live = locked/final; Done = settled), group/round `<select>`, team search input, group matches by local calendar day with headers (knockout days show round), mark soonest open as Next up. Compute day buckets client-side from `startsAt`.
- [ ] **Step 4:** Rewrite matches `page.tsx` to render `<MatchBrowser>` (still server-loads `listMatches`, filters out gala).
- [ ] **Step 5: Verify** — dev server: filters/search/grouping work; mobile width (375px) has no overflow; Next up highlighted.
- [ ] **Step 6: Commit** — `git commit -am "feat(matches): day-grouped browsing with filters and search"`

### Task 11: Component restyle sweep + min-bet/stage surfaces

**Files:** `components/AppShell.tsx`, `components/BetForm.tsx`, `components/LeaderboardTable.tsx`, `components/admin/{CreateMatchForm,ClanSettingsForm}.tsx`, `components/{ClanCard,Trophy,Disclaimer,BetHistoryTable,InviteCopy,JoinByCodeBox,ClanCreateForm}.tsx`, pages under `app/clans/**`, `app/{dashboard,page,login,signup}/`.

- [ ] **Step 1: `AppShell`** — neutral header, real wordmark (Inter, accent on "Bets"), drop "Insert coin"/"Quit"/"Select Game" arcade copy → "Sign up"/"Log out"/"← All pools"; responsive.
- [ ] **Step 2: `BetForm`** — neutral chips/inputs; show `Min X · Max Y`; keep gala fixed-entry; remove neon borders.
- [ ] **Step 3: `LeaderboardTable`** — headline **Points** column (net, green/red, `+` prefix from `row.netPoints`), then Bets/Wins/Losses/Biggest win, and a small muted **Credits** column (`row.balance`). Remove the Net-change column. Make horizontally scroll-safe on mobile (or hide low-priority columns at `sm`).
- [ ] **Step 4: `CreateMatchForm`** — replace "Allow a draw" checkbox with **Match type** Group/Knockout segmented control; show optional **Round** input when Knockout; add **Min bet** field; keep Max bet. Wire the timezone hidden field from Task 7.
- [ ] **Step 5: `ClanSettingsForm`** + `updateClanSettings` (`lib/services/clans.ts`) + `updateClanSettingsAction` — add **default min bet** field/validation.
- [ ] **Step 6:** Sweep the remaining components/pages for arcade classes (`font-pixel`, `glow-*`, `stamp`, `border-2 border-neon-*`, `blink`, "high score"/"coin" copy) → neutral equivalents. Grep: `grep -rn "font-pixel\|glow-\|box-glow\|blink\|neon-\|stamp\|Insert coin\|High Score" app components`.
- [ ] **Step 7: Verify** — `npm run typecheck && npm run lint`; walk every route in dev at mobile + desktop widths.
- [ ] **Step 8: Commit** — `git commit -am "feat(ui): restyle remaining components; surface min bet, stage, points"`

---

## Phase D — Verify & deploy

### Task 12: Full verification

- [ ] **Step 1:** `npm run test` (all green), `npm run typecheck`, `npm run lint`.
- [ ] **Step 2:** `npm run dev` — manual pass: signup/login, dashboard, matches browsing (filters/search/day groups/Next up), place a bet below min (rejected), a knockout match shows no Draw, kickoff times in local tz, leaderboard ranks by points with Credits secondary, theme follows device + toggles, mobile 375px clean.
- [ ] **Step 3:** Fix any issues found; re-run Step 1.

### Task 13: Deploy

- [ ] **Step 1: Apply prod migration.** With the production `DATABASE_URL` (Neon) available, run `npm run db:migrate` against prod (or `db:push`). Adding columns with defaults is non-breaking; existing rows backfill (`stage='group'`, `min_bet=null`). Note: existing clans keep their stored `defaultMaxBet` (100) unless updated — confirm with user whether to bump existing clans to 500.
- [ ] **Step 2: Merge to `main`** — open PR from `v2-redesign`, or fast-forward merge; push. Vercel auto-deploys from `main`.
- [ ] **Step 3: Smoke-check production** — load the deployed URL, verify theme + a match list render, place a test bet.

## Self-Review notes

- Spec §1–6 + mobile each map to tasks (8/9/11; 10; 2; 3+5; 6+7; 4; all UI tasks).
- Default values consistent everywhere (min 100, max 500).
- `buildOutcomeLabels`, `rankLeaderboard`, `assertAtLeastMinBet`, `LocalTime` names are used consistently across tasks.
- Open deploy question (bump existing clans to max 500?) flagged in Task 13.
