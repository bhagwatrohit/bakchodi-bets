import { describe, it, expect } from "vitest";
import { rankLeaderboard } from "@/lib/services/bets";
import type { LeaderboardRow } from "@/lib/types";

const base: Omit<LeaderboardRow, "rank" | "userId" | "netPoints" | "balance"> = {
  displayName: "x",
  betsPlaced: 0,
  wins: 0,
  losses: 0,
  biggestWin: "0",
  isMe: false,
};

describe("rankLeaderboard", () => {
  it("ranks by net points, not balance", () => {
    const out = rankLeaderboard([
      { ...base, userId: "a", netPoints: "100", balance: "900" },
      { ...base, userId: "b", netPoints: "400", balance: "800" },
    ]);
    expect(out.map((r) => r.userId)).toEqual(["b", "a"]);
    expect(out[0].rank).toBe(1);
    expect(out[1].rank).toBe(2);
  });

  it("breaks ties by wins then fewer bets", () => {
    const out = rankLeaderboard([
      { ...base, userId: "a", netPoints: "50", wins: 1, betsPlaced: 5, balance: "1000" },
      { ...base, userId: "b", netPoints: "50", wins: 1, betsPlaced: 2, balance: "1000" },
    ]);
    expect(out.map((r) => r.userId)).toEqual(["b", "a"]);
  });

  it("puts members with no completed bets last", () => {
    const out = rankLeaderboard([
      { ...base, userId: "a", netPoints: "0", balance: "1000" },
      { ...base, userId: "b", netPoints: "-30", balance: "970" },
      { ...base, userId: "c", netPoints: "120", balance: "1120" },
    ]);
    expect(out.map((r) => r.userId)).toEqual(["c", "a", "b"]);
  });
});
