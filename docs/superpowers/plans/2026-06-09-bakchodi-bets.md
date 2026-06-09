# Bakchodi Bets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality MVP of a private funny-money World Cup prediction-pool web app (create clan → invite → bet → settle → leaderboard).

**Architecture:** Next.js App Router. UI → Server Actions → server-only service layer (all validation + authorization) → Drizzle ORM → Postgres (local Docker now, Lakebase later). Settlement is a pure, unit-tested function wrapped in a DB transaction.

**Tech Stack:** Next.js 15, TypeScript, Tailwind, shadcn/ui, Drizzle ORM, `pg`/`postgres`, `jose` (JWT), `bcryptjs`, `decimal.js`, Vitest, Docker Postgres.

---

## Execution Model

**Phase 0 (foundation) is serial and must be 100% complete and committed before any fan-out.** It locks every shared contract below. Phases 1–5 are independent subagent tasks that only *consume* Phase 0 contracts and own disjoint files. Phase 6 integrates and verifies.

### LOCKED CONTRACTS (do not change in fan-out without coordination)

**Money:** all balances/stakes are Postgres `numeric`, represented in TS as `string`. Use `decimal.js` for any arithmetic. Display rounds to 2 decimals.

**Shared types (`lib/types.ts`):**
```ts
export type ClanRole = 'admin' | 'member';
export type MatchStatus = 'open' | 'locked' | 'final' | 'settled';
export type BetStatus = 'pending' | 'won' | 'lost' | 'void';
export type LedgerType =
  | 'initial_balance' | 'bet_placed' | 'bet_won_payout'
  | 'bet_void_refund' | 'admin_adjustment';
```

**Service signatures (server-only, all throw `ServiceError` on validation/authorization failure):**
```ts
// lib/services/auth.ts
signUp(input: { email: string; password: string; displayName: string }): Promise<{ profileId: string }>
signIn(input: { email: string; password: string }): Promise<{ profileId: string }>
getSessionProfile(): Promise<{ id: string; displayName: string; email: string } | null>
signOut(): Promise<void>

// lib/services/clans.ts
createClan(input: { name: string; currencyName: string; startingBalance: string; defaultMaxBet: string; lockBetsAtMatchStart?: boolean; showBetsBeforeLock?: boolean; showBetsAfterLock?: boolean }): Promise<{ clanId: string }>
joinClan(input: { inviteCode: string }): Promise<{ clanId: string }>
getClanForInvite(inviteCode: string): Promise<{ id: string; name: string; currencyName: string; startingBalance: string; memberCount: number } | null>
listMyClans(): Promise<ClanCardData[]>      // { clanId, name, currencyName, balance, rank, memberCount, openMatchCount }
getClanContext(clanId: string): Promise<{ clan: Clan; membership: ClanMember } | null> // null if not a member
requireMember(clanId: string): Promise<ClanMember>   // throws if not member
requireAdmin(clanId: string): Promise<ClanMember>    // throws if not admin
updateClanSettings(clanId: string, patch: Partial<ClanSettings>): Promise<void> // admin only
adjustBalance(clanId: string, targetUserId: string, amount: string, reason: string): Promise<void> // admin only

// lib/services/matches.ts
createMatch(input: { clanId: string; title?: string; teamA: string; teamB: string; startsAt: string; maxBet?: string; includeDraw: boolean; outcomeALabel?: string; outcomeBLabel?: string }): Promise<{ matchId: string }> // admin only
updateMatch(matchId: string, patch): Promise<void>     // admin only
setMatchStatus(matchId: string, status: MatchStatus): Promise<void> // admin only (lock/unlock)
listMatches(clanId: string): Promise<MatchListItem[]>  // includes outcomes + caller's bet if any
getMatchDetail(clanId: string, matchId: string): Promise<MatchDetail> // outcomes, caller bet, caller balance, maxBet

// lib/services/bets.ts
placeBet(input: { clanId: string; matchId: string; outcomeId: string; stake: string }): Promise<{ betId: string }>
listMyBets(clanId: string): Promise<BetHistoryRow[]>
listAllBets(clanId: string, matchId?: string): Promise<BetHistoryRow[]> // admin OR visibility-rule gated
getLeaderboard(clanId: string): Promise<LeaderboardRow[]> // rank, name, balance, bets, wins, losses, net, biggestWin

// lib/services/settlement.ts
computeSettlement(bets: SettlementInputBet[], winningOutcomeId: string): SettlementResult  // PURE, no DB
settleMatch(input: { matchId: string; winningOutcomeId: string }): Promise<void> // admin only, atomic
voidMatch(input: { matchId: string }): Promise<void> // admin only, atomic
```

**Pure settlement types (`lib/services/settlement-types.ts`):**
```ts
export interface SettlementInputBet { betId: string; userId: string; outcomeId: string; stake: string; }
export interface SettlementBetResult { betId: string; userId: string; status: 'won' | 'lost'; stake: string; profit: string; payout: string; }
export interface SettlementResult { results: SettlementBetResult[]; losingPool: string; winningStake: string; }
```

**Route → owner phase map (disjoint file ownership):**
- Phase 1 owns: `app/(auth)/login`, `app/(auth)/signup`, `app/dashboard`, `app/onboarding` (if used), `components/ClanCard.tsx`, auth Server Actions.
- Phase 2 owns: `app/clans/new`, `app/clans/[clanId]/page.tsx` (clan home), `app/join/[inviteCode]`, clan Server Actions.
- Phase 3 owns: `app/clans/[clanId]/matches`, `app/clans/[clanId]/matches/[matchId]`, `components/MatchCard.tsx`, `components/BetForm.tsx`, bet Server Actions.
- Phase 4 owns: `app/clans/[clanId]/admin`, admin Server Actions, `lib/services/settlement.ts` settleMatch/voidMatch impl.
- Phase 5 owns: `app/clans/[clanId]/leaderboard`, `app/clans/[clanId]/bets`, `components/LeaderboardTable.tsx`.
- Phase 0 owns everything else (config, schema, lib/db, lib/types, auth lib, layout, AppShell, disclaimer, shadcn primitives, seed, settlement pure fn + tests).

---

## Phase 0 — Foundation (SERIAL, do all, commit)

### Task 0.1: Scaffold Next.js + Tailwind + tooling
**Files:** project root.
- [ ] Create Next.js app (App Router, TS, Tailwind, ESLint, `src/`? **No** — use root `app/`). Command:
  `npx create-next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes`
- [ ] Add deps: `npm i drizzle-orm postgres pg bcryptjs jose decimal.js nanoid clsx tailwind-merge class-variance-authority lucide-react` and dev: `npm i -D drizzle-kit @types/pg @types/bcryptjs vitest @vitejs/plugin-react dotenv tsx`
- [ ] Init shadcn: `npx shadcn@latest init -d` then add `button card input label badge table tabs dialog sonner` (`npx shadcn@latest add ...`). If shadcn init fails non-interactively, hand-create equivalent primitives under `components/ui/` (button, card, input, label, badge, table, tabs) using cva + tailwind-merge.
- [ ] Commit: `chore: scaffold next.js app with tailwind + shadcn`

### Task 0.2: Env + local Postgres
**Files:** `.env.local`, `.env.example`, `docker-compose.yml`, `README.md`
- [ ] `docker-compose.yml`: postgres:16, db `bakchodi`, user/pass `bakchodi`/`bakchodi`, port 5432, named volume.
- [ ] `.env.example` + `.env.local`:
  `DATABASE_URL=postgres://bakchodi:bakchodi@localhost:5432/bakchodi`
  `AUTH_SECRET=<32+ char random>` `NODE_ENV=development`
- [ ] `README.md`: quickstart (docker compose up, npm run db:migrate, npm run db:seed, npm run dev), Lakebase migration note, disclaimer.
- [ ] Commit.

### Task 0.3: Drizzle schema + migration + client
**Files:** `lib/db/schema.ts`, `lib/db/index.ts`, `drizzle.config.ts`, `package.json` scripts, `lib/db/migrations/*`
- [ ] `lib/db/schema.ts` — tables per spec §4: `profiles`, `authCredentials`, `clans`, `clanMembers`, `matches`, `matchOutcomes`, `bets`, `ledgerEntries`. UUID PK `defaultRandom()`, `numeric` money (mode string), timestamptz defaults, check constraints (status enums), unique constraints (`clan_id+user_id`, `match_id+user_id`, `clans.invite_code`, `authCredentials.email`), cascade on `clan_id`/`match_id`.
- [ ] `lib/db/index.ts` — export `db` (drizzle + `postgres(DATABASE_URL)`), and a `withTransaction(fn)` helper.
- [ ] `drizzle.config.ts` + scripts: `db:generate` (drizzle-kit generate), `db:migrate` (custom `tsx lib/db/migrate.ts`), `db:push`, `db:seed`.
- [ ] Generate migration, run against docker PG, verify tables exist (`\dt`).
- [ ] Commit.

### Task 0.4: Shared types + ServiceError
**Files:** `lib/types.ts`, `lib/errors.ts`, `lib/money.ts`
- [ ] `lib/types.ts` — enums + DTO interfaces from LOCKED CONTRACTS (Clan, ClanMember, ClanSettings, ClanCardData, MatchListItem, MatchDetail, BetHistoryRow, LeaderboardRow).
- [ ] `lib/errors.ts` — `class ServiceError extends Error { code: 'unauthorized'|'forbidden'|'validation'|'not_found'|'conflict'; }` + helpers.
- [ ] `lib/money.ts` — `add/sub/mul/div/cmp/isPositive/lte/round2/format(value, currencyName)` wrapping decimal.js, all string-in/string-out.
- [ ] Commit.

### Task 0.5: Auth library + session
**Files:** `lib/auth/session.ts`, `lib/auth/password.ts`, `middleware.ts`
- [ ] `lib/auth/password.ts` — `hash(pw)`, `verify(pw, hash)` (bcryptjs).
- [ ] `lib/auth/session.ts` — `createSession(profileId)` (jose JWT, httpOnly cookie `bb_session`, 7d), `readSession()` (returns profileId|null), `clearSession()`.
- [ ] `middleware.ts` — redirect unauthenticated users away from `/dashboard`, `/clans/*` to `/login`; redirect authed users away from `/login`,`/signup` to `/dashboard`. Public: `/`, `/join/*`, auth routes.
- [ ] Commit.

### Task 0.6: Layout, AppShell, disclaimer, base styling
**Files:** `app/layout.tsx`, `components/AppShell.tsx`, `components/Disclaimer.tsx`, `app/globals.css`
- [ ] Root layout: fonts, `<Toaster/>` (sonner), mobile-first container, footer `<Disclaimer/>` (verbatim legal text from spec §7).
- [ ] `AppShell` — top bar (app name "Bakchodi Bets", current clan switcher slot, sign-out), playful tone, no casino imagery.
- [ ] Commit.

### Task 0.7: Pure settlement function + Vitest (TDD)
**Files:** `lib/services/settlement.ts` (pure part), `lib/services/settlement-types.ts`, `tests/settlement.test.ts`, `vitest.config.ts`, `lib/services/validation.ts`
- [ ] Write `tests/settlement.test.ts` first — PRD Cases 1–7. Cases 1–3 assert `computeSettlement` numbers exactly (use string equality after round2). Cases 4–7 assert pure guard functions in `validation.ts` throw `ServiceError('validation'|'conflict')`: `assertWithinMaxBet`, `assertSufficientBalance`, `assertNoExistingBet`, `assertMatchOpenAndUnlocked`.
- [ ] Run `npm test` → FAIL.
- [ ] Implement `computeSettlement` (decimal.js, proportional split, edge cases: no winner → all lost no payout; no loser → winners refund stake only) + the guard functions.
- [ ] Run `npm test` → PASS (all 7).
- [ ] Commit.

### Task 0.8: Service-layer skeletons + seed
**Files:** `lib/services/{auth,clans,matches,bets}.ts`, `lib/services/settlement.ts` (settleMatch/voidMatch throwing `not implemented` stub for Phase 4), `lib/db/seed.ts`
- [ ] Create each service file exporting the LOCKED-CONTRACT signatures. Implement the **read** helpers + `requireMember`/`requireAdmin` + `getSessionProfile` fully (Phases need them). Mutating functions owned by later phases may be left as documented stubs **only if** their file is owned by that phase — but to avoid cross-file edits, implement ALL of `auth.ts`, `clans.ts`, `matches.ts`, `bets.ts` here in Phase 0 (they are shared), and let Phase 4 implement only `settleMatch`/`voidMatch` in `settlement.ts`. **Decision: Phase 0 implements all services except settleMatch/voidMatch.**
- [ ] `lib/db/seed.ts` — seed clan "Bakchodi World Cup" (Bakchodi Bucks, 1000, max 100), members Rohit/Ankit/Sumit/Ritika (with login creds, password `password`), matches Argentina-Brazil, India-Pakistan, Germany-France, USA-Mexico each with outcomes [TeamA, Draw, TeamB]. Idempotent.
- [ ] Run seed; verify rows. Commit.

**END PHASE 0 — verify `npm run build` + `npm test` green before fan-out.**

---

## Phase 1 — Auth pages + dashboard (subagent)
**Owns:** `app/login/page.tsx`, `app/signup/page.tsx`, `app/dashboard/page.tsx`, `components/ClanCard.tsx`, `app/actions/auth.ts`.
- [ ] Signup form (display name, email, password) → `signUp` action → `createSession` → redirect `/dashboard`. Onboarding disclaimer shown.
- [ ] Login form → `signIn` → redirect. Error states via sonner.
- [ ] Dashboard: `listMyClans()`. Empty state = onboarding ("Create a clan" / "Join with invite code"). Else grid of `ClanCard` (name, balance, rank, members, open matches, open CTA).
- [ ] Sign-out action. Acceptance: signup→dashboard→empty-state works; build+typecheck green.

## Phase 2 — Create clan + join + clan home (subagent)
**Owns:** `app/clans/new/page.tsx`, `app/clans/[clanId]/page.tsx`, `app/join/[inviteCode]/page.tsx`, `app/actions/clans.ts`.
- [ ] Create-clan form (name, currency, starting balance, default max bet, 3 visibility toggles) → `createClan` → redirect to clan home.
- [ ] Join page: `getClanForInvite` preview (name, members, currency, starting balance) → "Join clan" → `joinClan` (dup-join guarded) → redirect. Handle invalid code + already-member.
- [ ] Clan home: name, big balance, rank, upcoming matches preview, recent results, leaderboard preview (top 5), admin-panel link if admin, copy invite link button. Acceptance: create→home shows invite code; second user joins via link.

## Phase 3 — Matches list + detail + bet placement (subagent)
**Owns:** `app/clans/[clanId]/matches/page.tsx`, `app/clans/[clanId]/matches/[matchId]/page.tsx`, `components/MatchCard.tsx`, `components/BetForm.tsx`, `app/actions/bets.ts`.
- [ ] Matches page: tabs Open/Locked/Settled via `listMatches`. Each `MatchCard`: teams, start time, status, max bet, caller's bet if any, CTA.
- [ ] Match detail: outcomes, max bet, available balance, stake input, submit → `placeBet` action. Client shows validation but server is source of truth. Show result if settled.
- [ ] Bet form validation surfaced from `ServiceError`. Acceptance: place a bet, balance drops, duplicate/over-max/over-balance/locked all rejected with clear messages.

## Phase 4 — Admin panel + settlement (subagent)
**Owns:** `app/clans/[clanId]/admin/page.tsx`, `app/actions/admin.ts`, and the `settleMatch`/`voidMatch` impl in `lib/services/settlement.ts`.
- [ ] Implement `settleMatch` (load pending bets → `computeSettlement` → write payouts, bet statuses, ledger entries, set match settled — all in one `withTransaction`) and `voidMatch` (refund all pending, void bets, ledger, match settled).
- [ ] Admin page (server-guarded by `requireAdmin`): edit clan settings, show invite code/link, create match form, edit/lock/unlock match, set result + settle, void match, view all bets, manual balance adjustment with reason.
- [ ] Acceptance: admin creates match, members bet, admin settles → winners paid proportionally, losers lose, ledger correct. Re-settle blocked.

## Phase 5 — Leaderboard + bet history (subagent)
**Owns:** `app/clans/[clanId]/leaderboard/page.tsx`, `app/clans/[clanId]/bets/page.tsx`, `components/LeaderboardTable.tsx`.
- [ ] Leaderboard: `getLeaderboard` — rank, name, balance, bets placed, wins, losses, net change, biggest win, sorted by balance desc.
- [ ] Bet history: `listMyBets` (own) — match, pick, stake, status, payout, created at. Admins/visibility-allowed see all via `listAllBets`. Acceptance: numbers match settlement results.

## Phase 6 — Integration + verification (serial)
- [ ] `npm run build` clean; `npx tsc --noEmit` clean; `npm test` green.
- [ ] Manual smoke (dev server): signup → create clan → copy invite → (2nd browser/user) join → admin create match → both bet → settle → verify leaderboard + history + balances against PRD Example. Fix regressions.
- [ ] Final commit + update README.

---

## Self-Review notes
- All 20 acceptance criteria map to Phases 1–5 (auth/clan→P1-2, bet→P3, settle→P4, leaderboard/history→P5, privacy via service auth checks, disclaimer P0.6, no-payments by omission).
- Test cases 1–7 → Task 0.7.
- Money is `string` everywhere; arithmetic only via `lib/money.ts`/decimal.js — no floats.
- Service signatures are identical across plan references (verified against LOCKED CONTRACTS block).
