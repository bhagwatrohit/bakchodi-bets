"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchCard } from "@/components/MatchCard";
import type { MatchListItem, MatchOddsView } from "@/lib/types";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border-2 border-dashed border-grid px-4 py-12 text-center">
      <p className="kicker text-neon-amber blink">No Coins Inserted</p>
      <p className="mt-2 dateline">{message}</p>
    </div>
  );
}

function MatchGrid({
  matches,
  clanId,
  currencyName,
  empty,
  odds,
}: {
  matches: MatchListItem[];
  clanId: string;
  currencyName: string;
  empty: string;
  odds?: Record<string, MatchOddsView>;
}) {
  if (matches.length === 0) return <EmptyState message={empty} />;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map((m) => (
        <MatchCard
          key={m.id}
          match={m}
          clanId={clanId}
          currencyName={currencyName}
          odds={odds?.[m.id]}
        />
      ))}
    </div>
  );
}

export function MatchesTabs({
  open,
  locked,
  settled,
  clanId,
  currencyName,
  odds,
}: {
  open: MatchListItem[];
  locked: MatchListItem[];
  settled: MatchListItem[];
  clanId: string;
  currencyName: string;
  /** Bookmaker lines keyed by match id (open/upcoming matches only). */
  odds?: Record<string, MatchOddsView>;
}) {
  return (
    <Tabs defaultValue="open">
      <TabsList>
        <TabsTrigger value="open">
          OPEN <span className="tabular">({open.length})</span>
        </TabsTrigger>
        <TabsTrigger value="locked">
          LOCKED <span className="tabular">({locked.length})</span>
        </TabsTrigger>
        <TabsTrigger value="settled">
          FINAL <span className="tabular">({settled.length})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="open">
        <MatchGrid
          matches={open}
          clanId={clanId}
          currencyName={currencyName}
          odds={odds}
          empty="No matches on the board. Check back for the next round."
        />
      </TabsContent>
      <TabsContent value="locked">
        <MatchGrid
          matches={locked}
          clanId={clanId}
          currencyName={currencyName}
          empty="Nothing locked up just yet. Lines are still open."
        />
      </TabsContent>
      <TabsContent value="settled">
        <MatchGrid
          matches={settled}
          clanId={clanId}
          currencyName={currencyName}
          empty="No games over yet. The chaos is still unfolding."
        />
      </TabsContent>
    </Tabs>
  );
}
