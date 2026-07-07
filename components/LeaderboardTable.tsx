"use client";

import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "@/components/Trophy";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { format } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { LeaderboardRow } from "@/lib/types";

type SortKey = keyof Pick<
  LeaderboardRow,
  "rank" | "displayName" | "netPoints" | "betsPlaced" | "wins" | "losses" | "biggestWin" | "balance"
>;

type Dir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; align: "left" | "right"; headClass?: string }[] = [
  { key: "rank", label: "Rank", align: "left", headClass: "w-12" },
  { key: "displayName", label: "Player", align: "left" },
  { key: "netPoints", label: "Points", align: "right" },
  { key: "betsPlaced", label: "Bets", align: "right" },
  { key: "wins", label: "Wins", align: "right" },
  { key: "losses", label: "Losses", align: "right" },
  { key: "biggestWin", label: "Biggest win", align: "right" },
  { key: "balance", label: "Credits", align: "right" },
];

// Text sorts A→Z by default; everything else (points, credits, wins…) is more
// useful highest-first, so numeric columns default to descending.
const defaultDir = (key: SortKey): Dir => (key === "rank" || key === "displayName" ? "asc" : "desc");

/**
 * Leaderboard table with click-to-sort column headers. Defaults to rank order;
 * clicking a header sorts by that column (numeric columns start high→low),
 * clicking the active header again flips direction. Highlights the caller's row.
 */
export function LeaderboardTable({
  rows,
  currencyName,
}: {
  rows: LeaderboardRow[];
  currencyName: string;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: Dir }>({ key: "rank", dir: "asc" });

  const sorted = useMemo(() => {
    const { key, dir } = sort;
    const factor = dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const cmp =
        key === "displayName"
          ? a.displayName.localeCompare(b.displayName)
          : Number(a[key]) - Number(b[key]);
      // Stable tiebreak on rank so equal values keep a deterministic order.
      return factor * cmp || a.rank - b.rank;
    });
  }, [rows, sort]);

  const onSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: defaultDir(key) },
    );

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="kicker">No scores yet</p>
        <p className="headline mt-1 text-xl">Nobody on the board</p>
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
          {COLUMNS.map((col) => {
            const active = sort.key === col.key;
            const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
            return (
              <TableHead
                key={col.key}
                className={cn(col.align === "right" && "text-right", col.headClass)}
                aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
              >
                <button
                  type="button"
                  onClick={() => onSort(col.key)}
                  className={cn(
                    "inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-foreground",
                    col.align === "right" && "flex-row-reverse",
                    active && "text-foreground",
                  )}
                >
                  {col.label}
                  <Icon className={cn("h-3 w-3", active ? "opacity-100" : "opacity-40")} />
                </button>
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => {
          const net = Number(row.netPoints);
          const netUp = net >= 0;
          const netLabel = `${net > 0 ? "+" : ""}${format(row.netPoints, currencyName)}`;
          return (
            <TableRow key={row.userId} className={row.isMe ? "bg-muted" : undefined}>
              <TableCell className="tabular font-semibold text-muted-foreground">
                {row.rank === 1 ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[var(--accent-amber)]">
                    <Trophy className="h-3.5 w-3.5" /> 1st
                  </span>
                ) : (
                  `#${row.rank}`
                )}
              </TableCell>
              <TableCell className={row.isMe ? "font-bold" : undefined}>
                {row.displayName}
                {row.isMe ? <span className="text-muted-foreground"> — you</span> : ""}
              </TableCell>
              <TableCell className={`tabular text-right font-semibold ${netUp ? "text-gain" : "text-loss"}`}>
                {netLabel}
              </TableCell>
              <TableCell className="tabular text-right">{row.betsPlaced}</TableCell>
              <TableCell className="tabular text-right">{row.wins}</TableCell>
              <TableCell className="tabular text-right">{row.losses}</TableCell>
              <TableCell className="tabular text-right">{format(row.biggestWin, currencyName)}</TableCell>
              <TableCell className="tabular text-right text-muted-foreground">
                {format(row.balance, currencyName)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
