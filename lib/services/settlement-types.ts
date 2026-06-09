import type { Money } from "@/lib/money";
import type { BetStatus } from "@/lib/types";

export interface SettlementInputBet {
  betId: string;
  userId: string;
  outcomeId: string;
  stake: Money;
}

export interface SettlementBetResult {
  betId: string;
  userId: string;
  status: Extract<BetStatus, "won" | "lost">;
  stake: Money;
  profit: Money; // positive for winners, negative (= -stake) for losers
  payout: Money; // stake + profit for winners, 0 for losers
}

export interface SettlementResult {
  results: SettlementBetResult[];
  losingPool: Money; // total stake on losing outcomes
  winningStake: Money; // total stake on the winning outcome
}
