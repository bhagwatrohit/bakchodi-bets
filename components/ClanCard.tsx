import Link from "next/link";
import { Crown, Swords, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "@/lib/money";
import type { ClanCardData } from "@/lib/types";

/** Dashboard card for a clan the current user belongs to. Mobile-first. */
export function ClanCard({ clan }: { clan: ClanCardData }) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="truncate">{clan.name}</CardTitle>
        {clan.role === "admin" ? (
          <Badge variant="accent" className="shrink-0 gap-1">
            <Crown className="h-3 w-3" /> Admin
          </Badge>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Your balance
          </p>
          <p className="mt-0.5 text-2xl font-extrabold tracking-tight">
            {format(clan.balance, clan.currencyName)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">Rank #{clan.rank}</Badge>
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {clan.memberCount} {clan.memberCount === 1 ? "member" : "members"}
          </span>
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Swords className="h-4 w-4" />
            {clan.openMatchCount} open
          </span>
        </div>
      </CardContent>

      <CardFooter>
        <Link href={`/clans/${clan.clanId}`} className="w-full">
          <Button className="w-full">
            {clan.openMatchCount > 0 ? "Place your bets" : "Open clan"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
