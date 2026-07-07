import { add, format } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { LeaderboardRow } from "@/lib/types";

/**
 * Fun, at-a-glance views for the leaderboard page — a top-3 podium, a set of
 * "superlative" award cards, and a profit/loss diverging bar chart. All derived
 * purely from the leaderboard rows (no extra queries), so it's a cheap server
 * component that sits above the sortable grid.
 */
export function LeaderboardAnalytics({
  rows,
  currencyName,
}: {
  rows: LeaderboardRow[];
  currencyName: string;
}) {
  if (rows.length === 0) return null;

  const byRank = [...rows].sort((a, b) => a.rank - b.rank);
  const n = (v: string | number) => Number(v);

  // ---- pool at a glance ----
  // Sum balances with the decimal-safe money helper (lib/money warns against
  // raw JS float arithmetic on credits).
  const totalCredits = rows.reduce((s, r) => add(s, r.balance), "0");
  const totalBets = rows.reduce((s, r) => s + r.betsPlaced, 0);
  const totalWins = rows.reduce((s, r) => s + r.wins, 0);

  // ---- superlatives ----
  const pickMax = (score: (r: LeaderboardRow) => number, eligible: (r: LeaderboardRow) => boolean = () => true) => {
    let best: LeaderboardRow | null = null;
    let bestScore = -Infinity;
    for (const r of rows) {
      if (!eligible(r)) continue;
      const s = score(r);
      if (s > bestScore) { bestScore = s; best = r; }
    }
    return best;
  };
  const winRate = (r: LeaderboardRow) => (r.wins + r.losses > 0 ? r.wins / (r.wins + r.losses) : 0);

  const awards = [
    { emoji: "💰", title: "Fattest Stack", sub: "most credits", who: pickMax((r) => n(r.balance)), val: (r: LeaderboardRow) => format(r.balance, currencyName) },
    { emoji: "🎯", title: "Sharpshooter", sub: "best win rate (3+ settled)", who: pickMax(winRate, (r) => r.wins + r.losses >= 3), val: (r: LeaderboardRow) => `${Math.round(winRate(r) * 100)}%` },
    { emoji: "🚀", title: "Biggest Score", sub: "largest single win", who: pickMax((r) => n(r.biggestWin), (r) => n(r.biggestWin) > 0), val: (r: LeaderboardRow) => format(r.biggestWin, currencyName) },
    { emoji: "🔥", title: "Busiest Bettor", sub: "most bets placed", who: pickMax((r) => r.betsPlaced, (r) => r.betsPlaced > 0), val: (r: LeaderboardRow) => `${r.betsPlaced} bets` },
    { emoji: "💀", title: "Hard Luck", sub: "most losses", who: pickMax((r) => r.losses, (r) => r.losses > 0), val: (r: LeaderboardRow) => `${r.losses} losses` },
  ].filter((a) => a.who);

  // ---- podium (top 3) ----
  const podium = byRank.slice(0, 3);
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean); // 2nd, 1st, 3rd
  const medal = (rank: number) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉");
  const heights: Record<number, string> = { 1: "h-24", 2: "h-16", 3: "h-12" };

  // ---- profit / loss diverging bars ----
  const byNet = [...rows].sort((a, b) => n(b.netPoints) - n(a.netPoints));
  const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(n(r.netPoints))));

  return (
    <div className="flex flex-col gap-5">
      {/* Pool at a glance */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Players", value: `${rows.length}` },
          { label: "Credits in play", value: format(totalCredits, currencyName) },
          { label: "Bets placed", value: `${totalBets}` },
          { label: "Wins paid", value: `${totalWins}` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="kicker">{s.label}</p>
            <p className="tabular mt-0.5 text-lg font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Podium */}
      {podium.length >= 3 ? (
        <div>
          <p className="kicker mb-2">On the podium</p>
          <div className="flex items-end justify-center gap-3">
            {podiumOrder.map((r) => (
              <div key={r.userId} className="flex w-24 flex-col items-center gap-1 sm:w-28">
                <span className="text-2xl">{medal(r.rank)}</span>
                <span className={cn("truncate text-sm font-semibold", r.isMe && "text-primary")}>
                  {r.displayName}
                </span>
                <div
                  className={cn(
                    "flex w-full items-start justify-center rounded-t-md border border-b-0 border-border pt-1.5",
                    heights[r.rank],
                    r.rank === 1 ? "bg-[var(--accent-amber)]/15" : "bg-muted",
                  )}
                >
                  <span className="tabular text-xs font-bold text-muted-foreground">
                    {format(r.netPoints, currencyName)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Superlative awards */}
      {awards.length > 0 ? (
        <div>
          <p className="kicker mb-2">Superlatives</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {awards.map((a) => (
              <div key={a.title} className="flex flex-col gap-0.5 rounded-lg border border-border bg-card p-3">
                <span className="text-xl">{a.emoji}</span>
                <span className="kicker">{a.title}</span>
                <span className={cn("truncate text-sm font-bold", a.who!.isMe && "text-primary")}>
                  {a.who!.displayName}
                </span>
                <span className="tabular text-xs text-muted-foreground">{a.val(a.who!)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Profit / loss diverging bars */}
      <div>
        <p className="kicker mb-2">Profit &amp; loss</p>
        <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3">
          {byNet.map((r) => {
            const net = n(r.netPoints);
            const pct = (Math.abs(net) / maxAbs) * 50; // up to half the width each side
            return (
              <div key={r.userId} className="flex items-center gap-2 text-xs">
                <span className={cn("w-20 shrink-0 truncate sm:w-28", r.isMe ? "font-bold text-primary" : "text-muted-foreground")}>
                  {r.displayName}
                </span>
                <div className="relative h-4 flex-1">
                  <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border" aria-hidden />
                  <span
                    className={cn("absolute top-0.5 bottom-0.5 rounded-sm", net >= 0 ? "left-1/2 bg-gain" : "right-1/2 bg-loss")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={cn("tabular w-20 shrink-0 text-right font-semibold sm:w-24", net >= 0 ? "text-gain" : "text-loss")}>
                  {net > 0 ? "+" : ""}
                  {format(r.netPoints, currencyName)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
