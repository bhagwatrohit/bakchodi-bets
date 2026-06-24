import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, Ticket } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClanCard } from "@/components/ClanCard";
import { JoinByCodeBox } from "@/components/JoinByCodeBox";
import { Trophy } from "@/components/Trophy";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionProfile } from "@/lib/services/auth";
import { listMyClans } from "@/lib/services/clans";

export default async function DashboardPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?next=/dashboard");

  const clans = await listMyClans();

  return (
    <AppShell profile={profile}>
      {clans.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker">Your Clans</p>
              <div className="mt-1 flex items-center gap-3">
                <Trophy className="h-8 w-8" />
                <h1 className="headline text-2xl sm:text-3xl">All pools</h1>
              </div>
              <p className="mt-2 text-base text-muted-foreground">
                Every clan you play in — pick one, place your bets, climb the leaderboard.
              </p>
            </div>
            <Link href="/clans/new">
              <Button>
                <PlusCircle className="h-4 w-4" /> New clan
              </Button>
            </Link>
          </div>
          <hr className="rule-thick" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clans.map((clan) => (
              <ClanCard key={clan.clanId} clan={clan} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <p className="kicker">Join a clan</p>
              <CardTitle>Enter clan code</CardTitle>
              <CardDescription>Got an invite code? Join a friend&apos;s clan to start betting.</CardDescription>
            </CardHeader>
            <CardContent className="sm:max-w-sm">
              <JoinByCodeBox />
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <div className="border-y border-border py-6 text-center">
        <p className="kicker">No clans yet</p>
        <h1 className="headline mt-2 text-2xl sm:text-3xl">Start one</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
          You&apos;re not in any clans yet. A clan is your private prediction
          pool — start one and invite your crew, or jump into a friend&apos;s game
          with their invite code.
        </p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Card className="flex flex-col text-left">
          <CardHeader>
            <p className="kicker">New clan</p>
            <CardTitle className="mt-1 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-accent" /> Start a clan
            </CardTitle>
            <CardDescription>
              Set the starting balance, max bet, and the rules of chaos.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href="/clans/new">
              <Button className="w-full">New clan</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col text-left">
          <CardHeader>
            <p className="kicker">Join a clan</p>
            <CardTitle className="mt-1 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-accent" /> Enter clan code
            </CardTitle>
            <CardDescription>Got an invite code from a friend? Punch it in below.</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <JoinByCodeBox />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
