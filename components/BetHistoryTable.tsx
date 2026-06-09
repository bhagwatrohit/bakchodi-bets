import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "@/lib/money";
import type { BetHistoryRow, BetStatus } from "@/lib/types";

// Stamp colour per status, in the newsprint ink palette.
const STATUS_STAMP: Record<BetStatus, string> = {
  pending: "text-ink",
  won: "text-success",
  lost: "text-danger",
  void: "text-ink-soft",
};

const STATUS_LABEL: Record<BetStatus, string> = {
  pending: "Pending",
  won: "Won",
  lost: "Lost",
  void: "Void",
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
      <div className="border-2 border-ink bg-paper-2 p-8 text-center">
        <p className="kicker">Late Edition</p>
        <p className="headline mt-1 text-xl">No wagers on the books</p>
        <p className="mt-2 text-sm italic text-ink-soft">The ledger is empty — go place one.</p>
      </div>
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
            <TableCell className="tabular text-right">{format(row.stake, currencyName)}</TableCell>
            <TableCell>
              <span className={`stamp ${STATUS_STAMP[row.status]}`}>
                {STATUS_LABEL[row.status]}
              </span>
            </TableCell>
            <TableCell className="tabular text-right">{format(row.payout, currencyName)}</TableCell>
            <TableCell className="dateline whitespace-nowrap">
              {dateFmt.format(row.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
