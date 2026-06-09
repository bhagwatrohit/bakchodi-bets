import Link from "next/link";
import { Crown, Swords, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "@/lib/money";
import type { ClanCardData } from "@/lib/types";

/** Dashboard "column" for a clan the current user belongs to. Mobile-first. */
export function ClanCard({ clan }: { clan: ClanCardData }) {
  const isAdmin = clan.role === "admin";

  return (
    <Card className="flex flex-col border-2 border-grid transition-shadow hover:border-neon-cyan hover:box-glow">
      <CardHeader className="gap-1">
        <p className="kicker flex items-center gap-1">
          {isAdmin ? (
            <>
              <Crown className="h-3 w-3 text-accent" /> Host
            </>
          ) : (
            "Player"
          )}
        </p>
        <CardTitle className="headline truncate text-base normal-case tracking-tight">
          {clan.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div>
          <p className="dateline">Your balance</p>
          <p className="tabular glow-green mt-0.5 text-2xl font-bold tracking-tight text-neon-green">
            {format(clan.balance, clan.currencyName)}
          </p>
        </div>

        <hr className="rule-hair" />

        <dl className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex flex-col">
            <dt className="dateline">Rank</dt>
            <dd className="tabular text-sm font-semibold text-neon-amber glow-amber">RANK #{clan.rank}</dd>
          </div>
          <div className="flex flex-col border-l border-grid pl-4">
            <dt className="dateline flex items-center gap-1">
              <Users className="h-3 w-3" /> Players
            </dt>
            <dd className="tabular text-sm font-semibold text-neon-cyan">
              {clan.memberCount} {clan.memberCount === 1 ? "player" : "players"}
            </dd>
          </div>
          <div className="flex flex-col border-l border-grid pl-4">
            <dt className="dateline flex items-center gap-1">
              <Swords className="h-3 w-3" /> Open
            </dt>
            <dd className="tabular text-sm font-semibold text-neon-cyan">{clan.openMatchCount} matches</dd>
          </div>
        </dl>
      </CardContent>

      <CardFooter>
        <Link href={`/clans/${clan.clanId}`} className="w-full">
          <Button className="w-full">Enter</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
