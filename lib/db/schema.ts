import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  timestamp,
  integer,
  unique,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/*
  Schema for Bakchodi Bets. Vanilla Postgres → runs on local Docker now and on
  Lakebase (managed Postgres) later with no changes. Money columns are numeric
  with mode:"string" so values never pass through JS floats.
  Every bettable row carries clan_id to make server-side authorization simple
  and to make future Postgres RLS policies mechanical.
*/

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Replaces Supabase Auth: holds login credentials for a profile. */
export const authCredentials = pgTable("auth_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clans = pgTable("clans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdBy: uuid("created_by").references(() => profiles.id),
  currencyName: text("currency_name").notNull().default("credits"),
  startingBalance: numeric("starting_balance", { mode: "string" }).notNull().default("1000"),
  defaultMinBet: numeric("default_min_bet", { mode: "string" }).notNull().default("100"),
  defaultMaxBet: numeric("default_max_bet", { mode: "string" }).notNull().default("500"),
  lockBetsAtMatchStart: boolean("lock_bets_at_match_start").notNull().default(true),
  showBetsBeforeLock: boolean("show_bets_before_lock").notNull().default(false),
  showBetsAfterLock: boolean("show_bets_after_lock").notNull().default(true),
  inviteCode: text("invite_code").notNull().unique(),
  isGlobalPool: boolean("is_global_pool").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clanMembers = pgTable(
  "clan_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clanId: uuid("clan_id")
      .notNull()
      .references(() => clans.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    balance: numeric("balance", { mode: "string" }).notNull().default("0"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("clan_members_clan_user_uq").on(t.clanId, t.userId),
    index("clan_members_user_idx").on(t.userId),
    check("clan_members_role_chk", sql`${t.role} in ('admin','member')`),
  ],
);

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clanId: uuid("clan_id")
      .notNull()
      .references(() => clans.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    teamA: text("team_a").notNull(),
    teamB: text("team_b").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("open"),
    // 'group' = group-stage (allows a Draw outcome). 'knockout' = no Draw.
    stage: text("stage").notNull().default("group"),
    // Knockout round label, e.g. "Round of 32", "Final" (null for group games).
    round: text("round"),
    // Group label for group-stage games, e.g. "A" (null for knockouts).
    groupLabel: text("group_label"),
    maxBet: numeric("max_bet", { mode: "string" }),
    minBet: numeric("min_bet", { mode: "string" }),
    // 'match' = normal team-vs-team. 'tournament_winner' = the Grand Gala pot
    // (pick the champion from all teams; one fixed entry stake set by the admin).
    marketType: text("market_type").notNull().default("match"),
    // When set (Grand Gala), every entry stakes exactly this much.
    fixedStake: numeric("fixed_stake", { mode: "string" }),
    winningOutcomeId: uuid("winning_outcome_id"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("matches_clan_idx").on(t.clanId),
    check("matches_status_chk", sql`${t.status} in ('open','locked','final','settled')`),
    check("matches_market_chk", sql`${t.marketType} in ('match','tournament_winner')`),
    check("matches_stage_chk", sql`${t.stage} in ('group','knockout')`),
  ],
);

export const matchOutcomes = pgTable(
  "match_outcomes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("match_outcomes_match_idx").on(t.matchId)],
);

export const bets = pgTable(
  "bets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clanId: uuid("clan_id")
      .notNull()
      .references(() => clans.id, { onDelete: "cascade" }),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    outcomeId: uuid("outcome_id")
      .notNull()
      .references(() => matchOutcomes.id),
    stake: numeric("stake", { mode: "string" }).notNull(),
    status: text("status").notNull().default("pending"),
    payout: numeric("payout", { mode: "string" }).notNull().default("0"),
    profit: numeric("profit", { mode: "string" }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    settledAt: timestamp("settled_at", { withTimezone: true }),
  },
  (t) => [
    unique("bets_match_user_uq").on(t.matchId, t.userId),
    index("bets_clan_idx").on(t.clanId),
    index("bets_match_idx").on(t.matchId),
    index("bets_user_idx").on(t.userId),
    check("bets_status_chk", sql`${t.status} in ('pending','won','lost','void')`),
  ],
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clanId: uuid("clan_id")
      .notNull()
      .references(() => clans.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    betId: uuid("bet_id").references(() => bets.id, { onDelete: "set null" }),
    transactionType: text("transaction_type").notNull(),
    amount: numeric("amount", { mode: "string" }).notNull(),
    balanceAfter: numeric("balance_after", { mode: "string" }).notNull(),
    reason: text("reason"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ledger_clan_user_idx").on(t.clanId, t.userId),
    check(
      "ledger_type_chk",
      sql`${t.transactionType} in ('initial_balance','bet_placed','bet_won_payout','bet_void_refund','admin_adjustment')`,
    ),
  ],
);

export type ProfileRow = typeof profiles.$inferSelect;
export type ClanRow = typeof clans.$inferSelect;
export type ClanMemberRow = typeof clanMembers.$inferSelect;
export type MatchRow = typeof matches.$inferSelect;
export type MatchOutcomeRow = typeof matchOutcomes.$inferSelect;
export type BetRow = typeof bets.$inferSelect;
export type LedgerRow = typeof ledgerEntries.$inferSelect;
