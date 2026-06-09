# Bakchodi Bets — Design Spec

**Date:** 2026-06-09
**Status:** Approved for implementation
**Source:** Product PRD (private funny-money World Cup prediction pool)

## 1. Goal

A private, **funny-money** prediction-pool web app for friends during the FIFA
World Cup. Users sign up, create a private clan, invite friends, place
fake-money bets on matches, and an admin settles results using zero-sum
pot-split logic. **Not real-money gambling** — no payments, deposits, cash-out,
or real currency. Fictional credits only.

The MVP priority is the **private clan loop**: create clan → invite → bet →
settle → leaderboard.

## 2. Key Technical Decisions

These resolve the instruction "build locally for now, use Lakebase instead of
Supabase, make your own technical decisions."

| Area | Decision | Why |
|------|----------|-----|
| Framework | Next.js 15 App Router + TypeScript | Per PRD; Server Actions for mutations |
| Styling | Tailwind CSS + shadcn/ui components | Per PRD; clean reusable primitives |
| Database | **Postgres** via **Drizzle ORM** | Type-safe, migration-driven, vanilla Postgres |
| Local DB | **Docker Postgres** (`docker-compose`) | Zero cloud dependency for "local for now" |
| Production DB | **Lakebase** (Databricks managed Postgres) | Same schema/driver — swap `DATABASE_URL` + OAuth token later |
| Auth | Self-rolled: email+password (bcrypt) + JWT in httpOnly cookie (`jose`) | Supabase Auth removed; Lakebase has no auth |
| Authorization | Server-side checks in Server Actions / service layer | PRD allows this RLS fallback; schema still RLS-ready |
| Settlement math | Pure function + `decimal.js`, DB-transaction-wrapped | Avoids float bugs; deterministic; unit-testable |
| Tests | Vitest (settlement logic, 7 PRD cases) | Fast, TS-native |

### Lakebase migration path (future, not in MVP)
Lakebase is Postgres-wire-compatible. To move off local Docker:
1. Provision a Lakebase instance; point `DATABASE_URL` at it.
2. Swap static password for short-lived **OAuth token** as the PG password
   (token refresh helper in `lib/db/lakebase-credential.ts`, stubbed for MVP).
3. Optionally layer Postgres RLS policies (schema already carries `clan_id`
   scoping on every row to make this mechanical).
No application-code changes beyond the connection/credential module.

## 3. Architecture

```
Next.js App Router (server components + server actions)
        │
        ├── Auth: jose JWT cookie  ──► middleware route guard
        │
        └── Service layer (lib/services/*)  ← all business logic, server-only
                 │  authorization checks (admin/member) live here
                 ▼
            Drizzle ORM  ──►  Postgres (local Docker now / Lakebase later)
```

- **UI components** are dumb; they call **Server Actions**, which call the
  **service layer**. Business logic never runs on the client.
- **Service layer** (`clans`, `matches`, `bets`, `settlement`, `auth`) owns all
  validation and authorization. Each function verifies the caller's identity and
  clan role server-side before mutating.
- **Settlement** is split: a **pure** `computeSettlement()` (no DB, fully
  tested) + a transactional `settleMatch()` that loads bets, calls the pure
  function, and writes payouts + ledger entries atomically.

## 4. Data Model

UUID PKs, `numeric` for money. Tables (per PRD):
`profiles`, `auth_credentials` (new — holds bcrypt hash, FK to profiles),
`clans`, `clan_members`, `matches`, `match_outcomes`, `bets`, `ledger_entries`.
`global_pool_members` deferred (data model carries `is_global_pool` flag only).

Notable additions vs PRD:
- `auth_credentials(profile_id, email unique, password_hash)` — replaces
  Supabase Auth. `profiles.id` no longer references `auth.users`.
- Every bettable row carries `clan_id` for clean authorization + future RLS.

Constraints enforced in DB: `unique(clan_id,user_id)`, `unique(match_id,user_id)`,
status check constraints, cascade deletes on `clan_id`.

## 5. Betting / Settlement Logic (zero-sum pot split)

On **placeBet** (atomic txn): validate (member, match open, not locked, stake>0,
stake≤maxBet, stake≤balance, no existing bet) → insert `bets(pending)` → deduct
balance → insert ledger `bet_placed`.

On **settleMatch** (admin only, atomic txn):
- `losingPool = Σ losing stakes`; `winningStake = Σ winning stakes`.
- Each winner: `profit = losingPool * stake / winningStake`; `payout = stake + profit`;
  credit balance; bet→`won`; ledger `bet_won_payout`.
- Each loser: bet→`lost`, payout 0, profit `-stake`.
- Edge: no winner → pot burned (no payouts). All winners / no losers →
  `losingPool=0`, winners refunded stake only.
- **voidMatch**: refund all pending stakes, bets→`void`, ledger `bet_void_refund`,
  match→`settled`.

Total clan credits are conserved except admin adjustments/resets.

## 6. Routes

`/`, `/login`, `/signup`, `/dashboard`, `/clans/new`, `/clans/[clanId]`,
`/clans/[clanId]/matches`, `/clans/[clanId]/matches/[matchId]`,
`/clans/[clanId]/leaderboard`, `/clans/[clanId]/bets`,
`/clans/[clanId]/admin`, `/join/[inviteCode]`.

## 7. Guardrails (legal)

Footer + onboarding disclaimer, verbatim: *"This app uses fictional credits only.
Credits have no cash value, cannot be purchased, cannot be redeemed, and are used
only for private entertainment within your group."* No deposit/withdraw/cash-out
language or currency symbols anywhere.

## 8. Testing

Vitest unit tests on `computeSettlement()` covering PRD Cases 1–7 (normal split,
everyone wins, no one wins, max-bet reject, insufficient-balance reject,
duplicate-bet reject, locked-match reject). Validation-reject cases are tested at
the service-validation level via pure guard functions.

## 9. Build Plan (multi-agent)

1. **Foundation (serial, coherent):** scaffold, Tailwind/shadcn, Drizzle +
   schema + migration, docker-compose, env, auth lib, base layout + disclaimer,
   service-interface stubs + shared types, seed script.
2. **Fan-out (parallel subagents)** on the stable foundation:
   - Auth pages + onboarding + dashboard
   - Create clan + join clan + clan home
   - Matches list + match detail + bet form
   - Admin panel + settlement/void services
   - Leaderboard + bet history
3. **Settlement pure logic + Vitest tests** (can run in parallel early).
4. **Integration pass + verification** (build, typecheck, tests, manual smoke).

## 10. Out of Scope (MVP)

Real payments, external sports API, complex odds, public markets, future bet
types (tournament winner, props, over/under), global pool UI. Data model stays
forward-compatible but UI exposes only simple match-winner bets.
