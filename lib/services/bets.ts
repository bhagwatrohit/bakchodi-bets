import "server-only";
import { and, eq, desc, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireMember } from "@/lib/services/clans";
import { conflict, forbidden, notFound, validation } from "@/lib/errors";
import { parseMoney, sub, cmp, type Money } from "@/lib/money";
import {
  assertMatchOpenAndUnlocked,
  assertNoExistingBet,
  assertPositiveStake,
  assertSufficientBalance,
  assertWithinMaxBet,
} from "@/lib/services/validation";
import type { BetHistoryRow, BetStatus, LeaderboardRow, MatchStatus } from "@/lib/types";

export async function placeBet(input: {
  clanId: string;
  matchId: string;
  outcomeId: string;
  stake: string;
}): Promise<{ betId: string }> {
  const membership = await requireMember(input.clanId);

  const clan = await db.query.clans.findFirst({ where: eq(schema.clans.id, input.clanId) });
  if (!clan) throw notFound("Clan not found.");

  const match = await db.query.matches.findFirst({
    where: and(eq(schema.matches.id, input.matchId), eq(schema.matches.clanId, input.clanId)),
  });
  if (!match) throw notFound("Match not found.");

  const outcome = await db.query.matchOutcomes.findFirst({
    where: and(
      eq(schema.matchOutcomes.id, input.outcomeId),
      eq(schema.matchOutcomes.matchId, input.matchId),
    ),
  });
  if (!outcome) throw validation("Pick a valid outcome.");

  // Grand Gala markets use a fixed entry stake set by the admin — the client's
  // stake value is ignored. Normal matches use the submitted stake (capped).
  let stake: Money;
  if (match.fixedStake != null) {
    stake = match.fixedStake;
  } else {
    const parsed = parseMoney(input.stake);
    if (!parsed) throw validation("Enter a valid bet amount.");
    stake = parsed;
  }

  const existing = await db.query.bets.findFirst({
    where: and(eq(schema.bets.matchId, input.matchId), eq(schema.bets.userId, membership.userId)),
  });

  // --- validation guards (pure, unit-tested) ---
  assertNoExistingBet(existing);
  assertMatchOpenAndUnlocked({
    status: match.status as MatchStatus,
    startsAt: match.startsAt,
    lockAtStart: clan.lockBetsAtMatchStart,
    now: new Date(),
  });
  assertPositiveStake(stake);
  if (match.fixedStake == null) {
    const effectiveMaxBet: Money = match.maxBet ?? clan.defaultMaxBet;
    assertWithinMaxBet(stake, effectiveMaxBet);
  }
  assertSufficientBalance(stake, membership.balance);

  // --- atomic: insert bet, deduct balance, ledger entry ---
  const betId = await db.transaction(async (tx) => {
    // Re-read balance inside the txn to avoid a race with concurrent bets.
    const member = await tx.query.clanMembers.findFirst({
      where: and(
        eq(schema.clanMembers.clanId, input.clanId),
        eq(schema.clanMembers.userId, membership.userId),
      ),
    });
    if (!member) throw forbidden("You're not a member of this clan.");
    if (cmp(stake, member.balance) > 0)
      throw validation("You don't have enough credits for that bet.");

    let bet;
    try {
      [bet] = await tx
        .insert(schema.bets)
        .values({
          clanId: input.clanId,
          matchId: input.matchId,
          userId: membership.userId,
          outcomeId: input.outcomeId,
          stake,
          status: "pending",
        })
        .returning({ id: schema.bets.id });
    } catch {
      // unique(match_id,user_id) violation under race
      throw conflict("You already have a bet on this match.");
    }

    const newBalance = sub(member.balance, stake);
    await tx
      .update(schema.clanMembers)
      .set({ balance: newBalance })
      .where(eq(schema.clanMembers.id, member.id));

    await tx.insert(schema.ledgerEntries).values({
      clanId: input.clanId,
      userId: membership.userId,
      betId: bet.id,
      transactionType: "bet_placed",
      amount: sub("0", stake), // negative
      balanceAfter: newBalance,
      reason: `Bet on ${outcome.label}`,
      createdBy: membership.userId,
    });

    return bet.id;
  });

  return { betId };
}

type BetJoinRow = {
  bet: typeof schema.bets.$inferSelect;
  match: typeof schema.matches.$inferSelect;
  outcome: typeof schema.matchOutcomes.$inferSelect;
  profile: typeof schema.profiles.$inferSelect;
};

function mapHistory(rows: BetJoinRow[]): BetHistoryRow[] {
  return rows.map(({ bet, match, outcome, profile }) => ({
    id: bet.id,
    matchId: bet.matchId,
    matchTitle: match.title,
    teamA: match.teamA,
    teamB: match.teamB,
    pick: outcome.label,
    stake: bet.stake,
    status: bet.status as BetStatus,
    payout: bet.payout,
    profit: bet.profit,
    createdAt: bet.createdAt,
    userId: bet.userId,
    displayName: profile.displayName,
  }));
}

async function queryBets(clanId: string, opts: { userId?: string; matchId?: string }) {
  const conditions = [eq(schema.bets.clanId, clanId)];
  if (opts.userId) conditions.push(eq(schema.bets.userId, opts.userId));
  if (opts.matchId) conditions.push(eq(schema.bets.matchId, opts.matchId));
  const rows = await db
    .select({
      bet: schema.bets,
      match: schema.matches,
      outcome: schema.matchOutcomes,
      profile: schema.profiles,
    })
    .from(schema.bets)
    .innerJoin(schema.matches, eq(schema.bets.matchId, schema.matches.id))
    .innerJoin(schema.matchOutcomes, eq(schema.bets.outcomeId, schema.matchOutcomes.id))
    .innerJoin(schema.profiles, eq(schema.bets.userId, schema.profiles.id))
    .where(and(...conditions))
    .orderBy(desc(schema.bets.createdAt));
  return mapHistory(rows);
}

/** The caller's own bets in a clan. */
export async function listMyBets(clanId: string): Promise<BetHistoryRow[]> {
  const membership = await requireMember(clanId);
  return queryBets(clanId, { userId: membership.userId });
}

/**
 * All bets in a clan (admin) or, for members, only when the clan visibility
 * setting allows it. When `matchId` is given, visibility is judged against that
 * match's lock state; otherwise non-admins must have after-lock visibility.
 */
export async function listAllBets(clanId: string, matchId?: string): Promise<BetHistoryRow[]> {
  const membership = await requireMember(clanId);
  if (membership.role !== "admin") {
    const clan = await db.query.clans.findFirst({ where: eq(schema.clans.id, clanId) });
    if (!clan) throw notFound("Clan not found.");
    let visible: boolean;
    if (matchId) {
      const match = await db.query.matches.findFirst({
        where: and(eq(schema.matches.id, matchId), eq(schema.matches.clanId, clanId)),
      });
      if (!match) throw notFound("Match not found.");
      const locked = match.status !== "open";
      visible = locked ? clan.showBetsAfterLock : clan.showBetsBeforeLock;
    } else {
      visible = clan.showBetsAfterLock;
    }
    if (!visible) throw forbidden("Bets aren't visible to members yet.");
  }
  return queryBets(clanId, { matchId });
}

export async function getLeaderboard(clanId: string): Promise<LeaderboardRow[]> {
  const membership = await requireMember(clanId);
  const clan = await db.query.clans.findFirst({ where: eq(schema.clans.id, clanId) });
  if (!clan) throw notFound("Clan not found.");

  const members = await db
    .select({ member: schema.clanMembers, profile: schema.profiles })
    .from(schema.clanMembers)
    .innerJoin(schema.profiles, eq(schema.clanMembers.userId, schema.profiles.id))
    .where(eq(schema.clanMembers.clanId, clanId));

  const rows: Omit<LeaderboardRow, "rank">[] = [];
  for (const { member, profile } of members) {
    const stats = await db
      .select({
        betsPlaced: sql<number>`count(*)::int`,
        wins: sql<number>`count(*) filter (where ${schema.bets.status} = 'won')::int`,
        losses: sql<number>`count(*) filter (where ${schema.bets.status} = 'lost')::int`,
        biggestWin: sql<string>`coalesce(max(${schema.bets.profit}) filter (where ${schema.bets.status} = 'won'), 0)::text`,
      })
      .from(schema.bets)
      .where(and(eq(schema.bets.clanId, clanId), eq(schema.bets.userId, member.userId)));
    const s = stats[0];
    rows.push({
      userId: member.userId,
      displayName: profile.displayName,
      balance: member.balance,
      betsPlaced: s.betsPlaced,
      wins: s.wins,
      losses: s.losses,
      netChange: sub(member.balance, clan.startingBalance),
      biggestWin: s.biggestWin,
      isMe: member.userId === membership.userId,
    });
  }

  rows.sort((a, b) => cmp(b.balance, a.balance));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
