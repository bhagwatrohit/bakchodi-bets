"use client";

import { useMemo, useState } from "react";
import { MatchRow } from "@/components/MatchRow";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MatchListItem, MatchOddsView, MatchStatus } from "@/lib/types";

type StatusFilter = "upcoming" | "today" | "live" | "done";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "today", label: "Today" },
  { key: "live", label: "Live" },
  { key: "done", label: "Done" },
];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Day bucket key + human label in the viewer's local timezone. */
function dayInfo(d: Date): { key: string; label: string } {
  const fmt = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
  const today = startOfDay(new Date());
  const day = startOfDay(d);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  const prefix = diff === 0 ? "Today · " : diff === 1 ? "Tomorrow · " : "";
  return { key: `${day.getTime()}`, label: `${prefix}${fmt}` };
}

function matchesStatus(m: MatchListItem, filter: StatusFilter): boolean {
  const s: MatchStatus = m.displayStatus;
  switch (filter) {
    case "upcoming":
      return s === "open";
    case "today": {
      const today = startOfDay(new Date()).getTime();
      return startOfDay(new Date(m.startsAt)).getTime() === today;
    }
    case "live":
      return s === "locked" || s === "final";
    case "done":
      return s === "settled";
  }
}

export function MatchBrowser({
  matches,
  clanId,
  currencyName,
  odds = {},
}: {
  matches: MatchListItem[];
  clanId: string;
  currencyName: string;
  odds?: Record<string, MatchOddsView>;
}) {
  const [status, setStatus] = useState<StatusFilter>("upcoming");
  const [group, setGroup] = useState("all");
  const [query, setQuery] = useState("");

  // Distinct group + round options actually present in the card.
  const groupOptions = useMemo(() => {
    const groups = new Set<string>();
    const rounds = new Set<string>();
    for (const m of matches) {
      if (m.groupLabel) groups.add(m.groupLabel);
      if (m.round) rounds.add(m.round);
    }
    return {
      groups: [...groups].sort(),
      rounds: [...rounds],
    };
  }, [matches]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = matches.filter((m) => {
      if (!matchesStatus(m, status)) return false;
      if (group !== "all" && m.groupLabel !== group && m.round !== group) return false;
      if (q && !`${m.teamA} ${m.teamB} ${m.title}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const dir = status === "done" ? -1 : 1;
    return rows.sort(
      (a, b) => dir * (new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    );
  }, [matches, status, group, query]);

  // The soonest still-open match anchors the "Next up" highlight.
  const nextUpId = useMemo(() => {
    const open = matches
      .filter((m) => m.displayStatus === "open")
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    return open[0]?.id ?? null;
  }, [matches]);

  // Group the filtered rows by local day, preserving sorted order.
  const days = useMemo(() => {
    const out: { key: string; label: string; items: MatchListItem[] }[] = [];
    for (const m of filtered) {
      const info = dayInfo(new Date(m.startsAt));
      let bucket = out.find((d) => d.key === info.key);
      if (!bucket) {
        bucket = { key: info.key, label: info.label, items: [] };
        out.push(bucket);
      }
      bucket.items.push(m);
    }
    return out;
  }, [filtered]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar — sticky on mobile so it's always reachable. */}
      <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 bg-background/95 px-4 py-2 backdrop-blur sm:flex-row sm:items-center">
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatus(f.key)}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                status === f.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-1 gap-2 sm:justify-end">
          {groupOptions.groups.length + groupOptions.rounds.length > 0 ? (
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none"
              aria-label="Filter by group or round"
            >
              <option value="all">All groups & rounds</option>
              {groupOptions.groups.map((g) => (
                <option key={`g-${g}`} value={g}>
                  Group {g}
                </option>
              ))}
              {groupOptions.rounds.map((r) => (
                <option key={`r-${r}`} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : null}
          <Input
            type="search"
            placeholder="Search teams…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="sm:max-w-[220px]"
            aria-label="Search teams"
          />
        </div>
      </div>

      {days.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center">
          <p className="font-semibold text-foreground">No matches here</p>
          <p className="dateline mt-1">
            {status === "upcoming"
              ? "Nothing open right now — check back for the next round."
              : status === "done"
                ? "No settled matches yet."
                : "Nothing to show with these filters."}
          </p>
        </div>
      ) : (
        days.map((d) => (
          <section key={d.key} className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="kicker">{d.label}</h2>
              <span className="h-px flex-1 bg-border" />
            </div>
            {d.items.map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                clanId={clanId}
                currencyName={currencyName}
                isNext={m.id === nextUpId}
                odds={odds[m.id]}
              />
            ))}
          </section>
        ))
      )}
    </div>
  );
}
