import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "@/components/Trophy";
import { format } from "@/lib/money";
import type { LeaderboardRow } from "@/lib/types";

/**
 * Presentational leaderboard table. Highlights the caller's own row.
 * Net change is colored green when >= 0, red otherwise, and prefixed with
 * "+" for positive values for a little flavor.
 */
export function LeaderboardTable({
  rows,
  currencyName,
}: {
  rows: LeaderboardRow[];
  currencyName: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="border-2 border-grid bg-card p-8 text-center">
        <p className="kicker">No Scores Yet</p>
        <p className="headline mt-1 text-xl">No high scores yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The board is empty. Place a bet to get your name on it.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Rank</TableHead>
          <TableHead>Player</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead className="text-right">Bets</TableHead>
          <TableHead className="text-right">Wins</TableHead>
          <TableHead className="text-right">Losses</TableHead>
          <TableHead className="text-right">Net change</TableHead>
          <TableHead className="text-right">Biggest win</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const net = Number(row.netChange);
          const netUp = net >= 0;
          const netLabel = `${net > 0 ? "+" : ""}${format(row.netChange, currencyName)}`;
          return (
            <TableRow key={row.userId} className={row.isMe ? "bg-muted" : undefined}>
              <TableCell className="tabular font-semibold text-muted-foreground">
                {row.rank === 1 ? (
                  <span className="inline-flex items-center gap-1.5 stamp text-neon-amber">
                    <Trophy className="h-3.5 w-3.5" /> 1ST
                  </span>
                ) : (
                  `#${row.rank}`
                )}
              </TableCell>
              <TableCell className={row.isMe ? "font-bold" : undefined}>
                {row.displayName}
                {row.isMe ? <span className="text-muted-foreground"> — you</span> : ""}
              </TableCell>
              <TableCell className="tabular text-right font-semibold">
                {format(row.balance, currencyName)}
              </TableCell>
              <TableCell className="tabular text-right">{row.betsPlaced}</TableCell>
              <TableCell className="tabular text-right">{row.wins}</TableCell>
              <TableCell className="tabular text-right">{row.losses}</TableCell>
              <TableCell className={`tabular text-right font-medium ${netUp ? "text-gain" : "text-loss"}`}>
                {netLabel}
              </TableCell>
              <TableCell className="tabular text-right">{format(row.biggestWin, currencyName)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
