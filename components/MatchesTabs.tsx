"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchCard } from "@/components/MatchCard";
import type { MatchListItem } from "@/lib/types";

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

function MatchGrid({
  matches,
  clanId,
  currencyName,
  empty,
}: {
  matches: MatchListItem[];
  clanId: string;
  currencyName: string;
  empty: string;
}) {
  if (matches.length === 0) return <EmptyState message={empty} />;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} clanId={clanId} currencyName={currencyName} />
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
}: {
  open: MatchListItem[];
  locked: MatchListItem[];
  settled: MatchListItem[];
  clanId: string;
  currencyName: string;
}) {
  return (
    <Tabs defaultValue="open">
      <TabsList>
        <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
        <TabsTrigger value="locked">Locked ({locked.length})</TabsTrigger>
        <TabsTrigger value="settled">Settled ({settled.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="open">
        <MatchGrid
          matches={open}
          clanId={clanId}
          currencyName={currencyName}
          empty="No open matches right now. Check back soon."
        />
      </TabsContent>
      <TabsContent value="locked">
        <MatchGrid
          matches={locked}
          clanId={clanId}
          currencyName={currencyName}
          empty="Nothing locked yet."
        />
      </TabsContent>
      <TabsContent value="settled">
        <MatchGrid
          matches={settled}
          clanId={clanId}
          currencyName={currencyName}
          empty="No settled matches yet. The chaos is still unfolding."
        />
      </TabsContent>
    </Tabs>
  );
}
