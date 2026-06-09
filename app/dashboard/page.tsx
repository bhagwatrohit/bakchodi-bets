import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, Ticket } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClanCard } from "@/components/ClanCard";
import { JoinByCodeBox } from "@/components/JoinByCodeBox";
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
              <p className="kicker">Your Beats</p>
              <h1 className="headline text-4xl sm:text-5xl">The Front Page</h1>
              <p className="mt-1 text-sm italic text-ink-soft">
                Every clan you cover — place your bets and check the standings.
              </p>
            </div>
            <Link href="/clans/new">
              <Button>
                <PlusCircle className="h-4 w-4" /> File a new clan
              </Button>
            </Link>
          </div>
          <hr className="rule-double" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clans.map((clan) => (
              <ClanCard key={clan.clanId} clan={clan} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <p className="kicker">Classifieds</p>
              <CardTitle>Join by Wire Code</CardTitle>
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
      <div className="border-y-2 border-ink py-6 text-center">
        <p className="kicker text-accent">Late Edition</p>
        <h1 className="headline mt-1 text-5xl sm:text-6xl">Slow News Day</h1>
        <p className="mx-auto mt-3 max-w-md text-sm italic text-ink-soft">
          You&apos;re not covering any clans yet. A clan is your private prediction
          pool — start one and invite your crew, or pick up a friend&apos;s beat
          with their invite code.
        </p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Card className="flex flex-col text-left">
          <CardHeader>
            <p className="kicker">Founding Editor</p>
            <CardTitle className="mt-1 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-accent" /> Start a clan
            </CardTitle>
            <CardDescription>
              Set the starting balance, max bet, and the rules of chaos.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href="/clans/new">
              <Button className="w-full">Found your clan</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col text-left">
          <CardHeader>
            <p className="kicker">Join by Wire Code</p>
            <CardTitle className="mt-1 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-accent" /> Join with a code
            </CardTitle>
            <CardDescription>Got an invite code from a friend? Wire it in below.</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <JoinByCodeBox />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
