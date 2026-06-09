import { add, sub, mul, div, isZero, neg, isPositive, type Money } from "@/lib/money";
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
    - no winner (winningStake == 0): everyone loses, pot is burned, no payout
    - no loser  (losingPool == 0): winners get their stake back, profit = 0

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

  const results: SettlementBetResult[] = bets.map((b) => {
    const isWinner = b.outcomeId === winningOutcomeId;
    if (isWinner && isPositive(winningStake)) {
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
    // loser (or "winner" with zero winning stake — impossible, defensive)
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

export async function settleMatch(_input: {
  matchId: string;
  winningOutcomeId: string;
}): Promise<void> {
  throw new Error("settleMatch not implemented (Phase 4).");
}

export async function voidMatch(_input: { matchId: string }): Promise<void> {
  throw new Error("voidMatch not implemented (Phase 4).");
}
