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
      <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No standings yet. Place a bet to get on the board.
      </p>
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
            <TableRow key={row.userId} className={row.isMe ? "bg-primary/10" : undefined}>
              <TableCell className="font-semibold text-muted-foreground">#{row.rank}</TableCell>
              <TableCell className={row.isMe ? "font-bold" : undefined}>
                {row.displayName}
                {row.isMe ? " (you)" : ""}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {format(row.balance, currencyName)}
              </TableCell>
              <TableCell className="text-right">{row.betsPlaced}</TableCell>
              <TableCell className="text-right">{row.wins}</TableCell>
              <TableCell className="text-right">{row.losses}</TableCell>
              <TableCell className={`text-right font-medium ${netUp ? "text-success" : "text-danger"}`}>
                {netLabel}
              </TableCell>
              <TableCell className="text-right">{format(row.biggestWin, currencyName)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
