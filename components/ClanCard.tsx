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
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="gap-1">
        <p className="kicker flex items-center gap-1">
          {isAdmin ? (
            <>
              <Crown className="h-3 w-3 text-accent" /> Editor-in-Chief
            </>
          ) : (
            "Staff Writer"
          )}
        </p>
        <CardTitle className="headline truncate text-2xl normal-case tracking-tight">
          {clan.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div>
          <p className="dateline">Your balance</p>
          <p className="tabular mt-0.5 text-2xl font-bold tracking-tight">
            {format(clan.balance, clan.currencyName)}
          </p>
        </div>

        <hr className="rule-hair" />

        <dl className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex flex-col">
            <dt className="dateline">Standing</dt>
            <dd className="tabular text-sm font-semibold">RANK #{clan.rank}</dd>
          </div>
          <div className="flex flex-col border-l border-hairline pl-4">
            <dt className="dateline flex items-center gap-1">
              <Users className="h-3 w-3" /> Crew
            </dt>
            <dd className="tabular text-sm font-semibold">
              {clan.memberCount} {clan.memberCount === 1 ? "writer" : "writers"}
            </dd>
          </div>
          <div className="flex flex-col border-l border-hairline pl-4">
            <dt className="dateline flex items-center gap-1">
              <Swords className="h-3 w-3" /> Open
            </dt>
            <dd className="tabular text-sm font-semibold">{clan.openMatchCount} matches</dd>
          </div>
        </dl>
      </CardContent>

      <CardFooter>
        <Link href={`/clans/${clan.clanId}`} className="w-full">
          <Button className="w-full">Open the desk</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
