import { describe, it, expect } from "vitest";
import { computeSettlement } from "@/lib/services/settlement";
import { round2 } from "@/lib/money";
import type { SettlementInputBet } from "@/lib/services/settlement-types";
import {
  assertWithinMaxBet,
  assertSufficientBalance,
  assertNoExistingBet,
  assertMatchOpenAndUnlocked,
} from "@/lib/services/validation";
import { ServiceError } from "@/lib/errors";

const OUT_A = "outcome-a";
const OUT_DRAW = "outcome-draw";
const OUT_B = "outcome-b";

function bet(betId: string, userId: string, outcomeId: string, stake: string): SettlementInputBet {
  return { betId, userId, outcomeId, stake };
}

function byUser(result: ReturnType<typeof computeSettlement>, userId: string) {
  const r = result.results.find((x) => x.userId === userId);
  if (!r) throw new Error(`no result for ${userId}`);
  return r;
}

describe("computeSettlement — zero-sum pot split", () => {
  it("Case 1: normal split (Rohit 100/A, Ankit 50/A, Sumit 150/B; A wins)", () => {
    const bets = [
      bet("b1", "rohit", OUT_A, "100"),
      bet("b2", "ankit", OUT_A, "50"),
      bet("b3", "sumit", OUT_B, "150"),
    ];
    const res = computeSettlement(bets, OUT_A);

    expect(round2(res.losingPool)).toBe("150");
    expect(round2(res.winningStake)).toBe("150");

    const rohit = byUser(res, "rohit");
    expect(rohit.status).toBe("won");
    expect(round2(rohit.profit)).toBe("100");
    expect(round2(rohit.payout)).toBe("200"); // stake 100 + profit 100

    const ankit = byUser(res, "ankit");
    expect(ankit.status).toBe("won");
    expect(round2(ankit.profit)).toBe("50");
    expect(round2(ankit.payout)).toBe("100"); // stake 50 + profit 50

    const sumit = byUser(res, "sumit");
    expect(sumit.status).toBe("lost");
    expect(round2(sumit.profit)).toBe("-150");
    expect(round2(sumit.payout)).toBe("0");

    // zero-sum: total profit nets to zero
    const totalProfit = res.results.reduce((acc, r) => acc + Number(r.profit), 0);
    expect(Math.round(totalProfit * 100) / 100).toBe(0);
  });

  it("Case 2: everyone wins — only stake refunded, no profit", () => {
    const bets = [bet("b1", "rohit", OUT_A, "100"), bet("b2", "ankit", OUT_A, "100")];
    const res = computeSettlement(bets, OUT_A);

    expect(round2(res.losingPool)).toBe("0");
    const rohit = byUser(res, "rohit");
    const ankit = byUser(res, "ankit");
    expect(rohit.status).toBe("won");
    expect(round2(rohit.profit)).toBe("0");
    expect(round2(rohit.payout)).toBe("100");
    expect(round2(ankit.payout)).toBe("100");
  });

  it("Case 3: no one wins (Rohit A, Ankit B; Draw wins) — both lose, no payout", () => {
    const bets = [bet("b1", "rohit", OUT_A, "100"), bet("b2", "ankit", OUT_B, "100")];
    const res = computeSettlement(bets, OUT_DRAW);

    expect(round2(res.winningStake)).toBe("0");
    expect(round2(res.losingPool)).toBe("200");
    const rohit = byUser(res, "rohit");
    const ankit = byUser(res, "ankit");
    expect(rohit.status).toBe("lost");
    expect(round2(rohit.payout)).toBe("0");
    expect(round2(rohit.profit)).toBe("-100");
    expect(ankit.status).toBe("lost");
    expect(round2(ankit.payout)).toBe("0");
  });

  it("uneven split rounds correctly (Rohit 100/A, Ankit 50/A, Sumit 90/B)", () => {
    const bets = [
      bet("b1", "rohit", OUT_A, "100"),
      bet("b2", "ankit", OUT_A, "50"),
      bet("b3", "sumit", OUT_B, "90"),
    ];
    const res = computeSettlement(bets, OUT_A);
    // losing pool 90 split across winning stake 150
    // rohit profit = 90 * 100/150 = 60 ; ankit = 90 * 50/150 = 30
    expect(round2(byUser(res, "rohit").profit)).toBe("60");
    expect(round2(byUser(res, "ankit").profit)).toBe("30");
    expect(round2(byUser(res, "rohit").payout)).toBe("160");
    expect(round2(byUser(res, "ankit").payout)).toBe("80");
  });
});

describe("bet placement guards", () => {
  it("Case 4: rejects stake above max bet", () => {
    expect(() => assertWithinMaxBet("101", "100")).toThrowError(ServiceError);
    expect(() => assertWithinMaxBet("100", "100")).not.toThrow();
  });

  it("Case 5: rejects stake above balance", () => {
    expect(() => assertSufficientBalance("100", "50")).toThrowError(ServiceError);
    expect(() => assertSufficientBalance("50", "50")).not.toThrow();
  });

  it("Case 6: rejects a duplicate bet", () => {
    expect(() => assertNoExistingBet({ id: "existing" })).toThrowError(ServiceError);
    expect(() => assertNoExistingBet(null)).not.toThrow();
  });

  it("Case 7: rejects a bet on a locked/started match", () => {
    const startsAt = new Date("2026-06-10T18:00:00Z");
    const afterStart = new Date("2026-06-10T18:30:00Z");
    const beforeStart = new Date("2026-06-10T17:00:00Z");

    expect(() =>
      assertMatchOpenAndUnlocked({ status: "open", startsAt, lockAtStart: true, now: afterStart }),
    ).toThrowError(ServiceError);

    expect(() =>
      assertMatchOpenAndUnlocked({ status: "locked", startsAt, lockAtStart: true, now: beforeStart }),
    ).toThrowError(ServiceError);

    expect(() =>
      assertMatchOpenAndUnlocked({ status: "open", startsAt, lockAtStart: true, now: beforeStart }),
    ).not.toThrow();

    // lock disabled => allowed even after start
    expect(() =>
      assertMatchOpenAndUnlocked({ status: "open", startsAt, lockAtStart: false, now: afterStart }),
    ).not.toThrow();
  });
});
