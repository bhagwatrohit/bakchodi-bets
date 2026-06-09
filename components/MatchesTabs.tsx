"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchCard } from "@/components/MatchCard";
import type { MatchListItem } from "@/lib/types";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border-2 border-dashed border-hairline px-4 py-12 text-center">
      <p className="kicker">Stop The Presses</p>
      <p className="mt-2 font-serif italic text-ink-soft">{message}</p>
    </div>
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
        <TabsTrigger value="open">
          Open Lines <span className="tabular">({open.length})</span>
        </TabsTrigger>
        <TabsTrigger value="locked">
          Locked <span className="tabular">({locked.length})</span>
        </TabsTrigger>
        <TabsTrigger value="settled">
          Final &amp; Settled <span className="tabular">({settled.length})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="open">
        <MatchGrid
          matches={open}
          clanId={clanId}
          currencyName={currencyName}
          empty="No matches on the wire. Check back for the next edition."
        />
      </TabsContent>
      <TabsContent value="locked">
        <MatchGrid
          matches={locked}
          clanId={clanId}
          currencyName={currencyName}
          empty="Nothing locked up just yet. The lines are still open."
        />
      </TabsContent>
      <TabsContent value="settled">
        <MatchGrid
          matches={settled}
          clanId={clanId}
          currencyName={currencyName}
          empty="No final whistles printed yet. The chaos is still unfolding."
        />
      </TabsContent>
    </Tabs>
  );
}
