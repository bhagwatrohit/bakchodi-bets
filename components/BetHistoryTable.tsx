import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "@/lib/money";
import type { BetHistoryRow, BetStatus } from "@/lib/types";

const STATUS_VARIANT: Record<BetStatus, "default" | "success" | "danger" | "outline"> = {
  pending: "default",
  won: "success",
  lost: "danger",
  void: "outline",
};

const dateFmt = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function matchLabel(row: BetHistoryRow): string {
  return row.matchTitle || `${row.teamA} vs ${row.teamB}`;
}

/**
 * Presentational bet-history table. Set `showPlayer` to add a Player column
 * (used for the all-bets view). Empty state nudges placing a bet.
 */
export function BetHistoryTable({
  rows,
  currencyName,
  showPlayer = false,
}: {
  rows: BetHistoryRow[];
  currencyName: string;
  showPlayer?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No bets yet — go place one.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showPlayer ? <TableHead>Player</TableHead> : null}
          <TableHead>Match</TableHead>
          <TableHead>Pick</TableHead>
          <TableHead className="text-right">Stake</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Payout</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            {showPlayer ? <TableCell className="font-medium">{row.displayName}</TableCell> : null}
            <TableCell className="font-medium">{matchLabel(row)}</TableCell>
            <TableCell>{row.pick}</TableCell>
            <TableCell className="text-right">{format(row.stake, currencyName)}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
            </TableCell>
            <TableCell className="text-right">{format(row.payout, currencyName)}</TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {dateFmt.format(row.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
