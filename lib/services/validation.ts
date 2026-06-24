import { conflict, validation } from "@/lib/errors";
import { cmp, isPositive, type Money } from "@/lib/money";
import type { MatchStatus } from "@/lib/types";

/*
  Pure validation guards for bet placement. No DB access — fully unit-testable.
  Each throws a ServiceError on failure. The bet-placement service composes
  these after loading the relevant rows.
*/

/** Stake must be a positive amount. */
export function assertPositiveStake(stake: Money): void {
  if (!isPositive(stake)) {
    throw validation("Bet amount must be greater than zero.");
  }
}

/** Stake must be at least the effective min bet (match override or clan default). */
export function assertAtLeastMinBet(stake: Money, minBet: Money): void {
  if (cmp(stake, minBet) < 0) {
    throw validation(`Bet must be at least ${minBet}.`);
  }
}

/** Stake must not exceed the effective max bet (match override or clan default). */
export function assertWithinMaxBet(stake: Money, maxBet: Money): void {
  if (cmp(stake, maxBet) > 0) {
    throw validation(`Bet exceeds the max bet of ${maxBet}.`);
  }
}

/** Stake must not exceed the user's available balance. */
export function assertSufficientBalance(stake: Money, balance: Money): void {
  if (cmp(stake, balance) > 0) {
    throw validation("You don't have enough credits for that bet.");
  }
}

/** Reject a second bet on the same match. */
export function assertNoExistingBet(existingBet: unknown): void {
  if (existingBet) {
    throw conflict("You already have a bet on this match.");
  }
}

/** Match must be open and (if lock-at-start enabled) not past its start time. */
export function assertMatchOpenAndUnlocked(args: {
  status: MatchStatus;
  startsAt: Date;
  lockAtStart: boolean;
  now: Date;
}): void {
  const { status, startsAt, lockAtStart, now } = args;
  if (status !== "open") {
    throw conflict("Betting is closed for this match.");
  }
  if (lockAtStart && now.getTime() >= startsAt.getTime()) {
    throw conflict("This match has already started — betting is locked.");
  }
}
