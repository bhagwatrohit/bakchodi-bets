# Bakchodi Bets 🏆

A private, **funny-money** prediction-pool web app for friends during the FIFA
World Cup. Create a clan, invite friends, bet fake credits, settle matches, and
fight for bragging rights.

> **This app uses fictional credits only.** Credits have no cash value, cannot be
> purchased, cannot be redeemed, and are used only for private entertainment within
> your group. There are no payments, deposits, or cash-out features.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** + hand-rolled shadcn-style UI primitives
- **Drizzle ORM** over **Postgres** (local now, **Lakebase** later — same schema)
- Self-rolled auth: bcrypt + JWT session cookie (`jose`)
- **Vitest** for settlement logic
- `decimal.js` for money math (no float bugs)

## Quickstart (local)

You need **Node 20+** and a local **Postgres 16**.

```bash
# 1. Install deps
npm install

# 2. Start Postgres
#    Option A — Docker:           npm run db:up
#    Option B — local Postgres:   create a "bakchodi" DB/role (see .env.example)
cp .env.example .env.local        # then set DATABASE_URL + a real AUTH_SECRET

# 3. Migrate + seed
npm run db:migrate
npm run db:seed

# 4. Run
npm run dev                       # http://localhost:3000
```

### Seed logins

Clan **Bakchodi World Cup** — invite code `WORLDCUP`. All passwords: `password`.

| Email | Role |
|-------|------|
| rohit@bakchodi.test | admin |
| ankit@bakchodi.test | member |
| sumit@bakchodi.test | member |
| ritika@bakchodi.test | member |

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Vitest (settlement + validation) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Generate a Drizzle migration from the schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed demo clan/users/matches |
| `npm run db:up` / `db:down` | Start/stop Docker Postgres |

## Architecture

UI → **Server Actions** → **service layer** (`lib/services/*`, all validation +
authorization) → **Drizzle** → Postgres. Business logic never runs on the client.
Settlement is a pure, unit-tested function wrapped in a DB transaction.

See `docs/superpowers/specs/` and `docs/superpowers/plans/` for the design + plan,
and `docs/NEXT16-NOTES.md` for Next 16 conventions.

## Moving to Lakebase

Lakebase is Databricks-managed Postgres — wire-compatible with vanilla Postgres.
Point `DATABASE_URL` at the Lakebase endpoint and supply a short-lived OAuth token
as the password (see `lib/db/lakebase-credential.ts`). Every row carries `clan_id`,
so Postgres RLS can be layered on mechanically. No query/application code changes.
