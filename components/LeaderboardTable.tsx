import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      <div className="border-2 border-ink bg-paper-2 p-8 text-center">
        <p className="kicker">Stop Press</p>
        <p className="headline mt-1 text-xl">No standings to report</p>
        <p className="mt-2 text-sm italic text-ink-soft">
          The table is bare. Place a bet to get your name on the board.
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
                  <span className="stamp stamp-rotated text-accent">Leader</span>
                ) : (
                  `#${row.rank}`
                )}
              </TableCell>
              <TableCell className={row.isMe ? "font-bold" : undefined}>
                {row.displayName}
                {row.isMe ? <span className="italic text-ink-soft"> — you</span> : ""}
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
