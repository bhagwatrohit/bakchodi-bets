import { add, mul, div, isZero, neg, isPositive, round2, type Money } from "@/lib/money";
import { conflict, notFound, validation } from "@/lib/errors";
import type {
  SettlementInputBet,
  SettlementBetResult,
  SettlementResult,
} from "@/lib/services/settlement-types";

/*
  PURE settlement math — no DB, no server-only. Fully unit-tested.

  Zero-sum pot split:
    - winningStake = Σ stakes on the winning outcome
    - losingPool   = Σ stakes on all other outcomes
    - each winner's profit = losingPool * (winnerStake / winningStake)
      payout = stake + profit
    - each loser: profit = -stake, payout = 0
  Edge cases:
    - no winner (winningStake == 0): NOBODY picked the winning outcome, so it's a
      PUSH — every stake is refunded (status "void", payout = stake, profit 0).
      Credits are never burned/lost.
    - no loser  (losingPool == 0): winners get their stake back, profit = 0.

  IMPORTANT: keep this module free of top-level `server-only` / DB imports so it
  stays importable from tests and so settleMatch/voidMatch below can lazy-import
  the DB layer.
*/
export function computeSettlement(
  bets: SettlementInputBet[],
  winningOutcomeId: string,
): SettlementResult {
  let winningStake: Money = "0";
  let losingPool: Money = "0";

  for (const b of bets) {
    if (b.outcomeId === winningOutcomeId) winningStake = add(winningStake, b.stake);
    else losingPool = add(losingPool, b.stake);
  }

  // No winner → push: refund every stake (don't burn the pot).
  if (isZero(winningStake)) {
    return {
      results: bets.map((b) => ({
        betId: b.betId,
        userId: b.userId,
        status: "void",
        stake: b.stake,
        profit: "0",
        payout: b.stake,
      })),
      losingPool,
      winningStake,
    };
  }

  const results: SettlementBetResult[] = bets.map((b) => {
    const isWinner = b.outcomeId === winningOutcomeId;
    if (isWinner) {
      const share = div(b.stake, winningStake); // fraction of winning pool
      const profit = isZero(losingPool) ? "0" : mul(losingPool, share);
      return {
        betId: b.betId,
        userId: b.userId,
        status: "won",
        stake: b.stake,
        profit,
        payout: add(b.stake, profit),
      };
    }
    return {
      betId: b.betId,
      userId: b.userId,
      status: "lost",
      stake: b.stake,
      profit: neg(b.stake),
      payout: "0",
    };
  });

  return { results, losingPool, winningStake };
}

/* ------------------------------------------------------------------ */
/* DB-backed orchestration — implemented in Phase 4 (admin).           */
/* Implement these by lazy-importing the DB layer INSIDE the function  */
/* (e.g. `const { withTransaction, schema } = await import("@/lib/db")`)*/
/* so this module stays test-importable. Must be admin-only + atomic.  */
/* ------------------------------------------------------------------ */

export async function settleMatch(input: {
  matchId: string;
  winningOutcomeId: string;
}): Promise<void> {
  const { matchId, winningOutcomeId } = input;
  // Lazy imports keep this module test-importable (no top-level server-only/DB).
  const { db, schema, withTransaction } = await import("@/lib/db");
  const { eq, and } = await import("drizzle-orm");
  const { requireAdmin } = await import("@/lib/services/clans");

  const match = await db.query.matches.findFirst({
    where: eq(schema.matches.id, matchId),
  });
  if (!match) throw notFound("Match not found.");

  await requireAdmin(match.clanId);

  if (match.status === "settled") throw conflict("Match already settled.");

  const winningOutcome = await db.query.matchOutcomes.findFirst({
    where: and(
      eq(schema.matchOutcomes.id, winningOutcomeId),
      eq(schema.matchOutcomes.matchId, matchId),
    ),
  });
  if (!winningOutcome) throw validation("Pick a valid winning outcome for this match.");

  const pendingBets = await db
    .select()
    .from(schema.bets)
    .where(and(eq(schema.bets.matchId, matchId), eq(schema.bets.status, "pending")));

  const inputs: SettlementInputBet[] = pendingBets.map((b) => ({
    betId: b.id,
    userId: b.userId,
    outcomeId: b.outcomeId,
    stake: b.stake,
  }));

  const { results } = computeSettlement(inputs, winningOutcomeId);

  await withTransaction(async (tx) => {
    for (const r of results) {
      const payout = round2(r.payout);
      const profit = round2(r.profit);
      await tx
        .update(schema.bets)
        .set({ status: r.status, payout, profit, settledAt: new Date() })
        .where(eq(schema.bets.id, r.betId));

      // Credit winners (payout) and pushes (stake refunded). Losers get nothing.
      if (r.status === "won" || r.status === "void") {
        const member = await tx.query.clanMembers.findFirst({
          where: and(
            eq(schema.clanMembers.clanId, match.clanId),
            eq(schema.clanMembers.userId, r.userId),
          ),
        });
        if (!member) continue;
        const newBalance = round2(add(member.balance, payout));
        await tx
          .update(schema.clanMembers)
          .set({ balance: newBalance })
          .where(eq(schema.clanMembers.id, member.id));
        await tx.insert(schema.ledgerEntries).values({
          clanId: match.clanId,
          userId: r.userId,
          betId: r.betId,
          transactionType: r.status === "won" ? "bet_won_payout" : "bet_void_refund",
          amount: payout,
          balanceAfter: newBalance,
          reason: r.status === "won" ? "Won bet" : "No winner — stake refunded",
          createdBy: member.userId,
        });
      }
    }

    await tx
      .update(schema.matches)
      .set({ status: "settled", winningOutcomeId, updatedAt: new Date() })
      .where(eq(schema.matches.id, matchId));
  });
}

export async function voidMatch(input: { matchId: string }): Promise<void> {
  const { matchId } = input;
  const { db, schema, withTransaction } = await import("@/lib/db");
  const { eq, and } = await import("drizzle-orm");
  const { requireAdmin } = await import("@/lib/services/clans");

  const match = await db.query.matches.findFirst({
    where: eq(schema.matches.id, matchId),
  });
  if (!match) throw notFound("Match not found.");

  await requireAdmin(match.clanId);

  if (match.status === "settled") throw conflict("Match already settled.");

  const pendingBets = await db
    .select()
    .from(schema.bets)
    .where(and(eq(schema.bets.matchId, matchId), eq(schema.bets.status, "pending")));

  await withTransaction(async (tx) => {
    for (const b of pendingBets) {
      const refund = round2(b.stake);
      await tx
        .update(schema.bets)
        .set({ status: "void", payout: refund, profit: "0", settledAt: new Date() })
        .where(eq(schema.bets.id, b.id));

      const member = await tx.query.clanMembers.findFirst({
        where: and(
          eq(schema.clanMembers.clanId, match.clanId),
          eq(schema.clanMembers.userId, b.userId),
        ),
      });
      if (!member) continue;
      const newBalance = round2(add(member.balance, refund));
      await tx
        .update(schema.clanMembers)
        .set({ balance: newBalance })
        .where(eq(schema.clanMembers.id, member.id));
      await tx.insert(schema.ledgerEntries).values({
        clanId: match.clanId,
        userId: b.userId,
        betId: b.id,
        transactionType: "bet_void_refund",
        amount: refund,
        balanceAfter: newBalance,
        reason: "Match voided",
        createdBy: member.userId,
      });
    }

    await tx
      .update(schema.matches)
      .set({ status: "settled", updatedAt: new Date() })
      .where(eq(schema.matches.id, matchId));
  });
}
