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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Your clans</h1>
              <p className="text-sm text-muted-foreground">
                Pick a clan to place bets and check the leaderboard.
              </p>
            </div>
            <Link href="/clans/new">
              <Button>
                <PlusCircle className="h-4 w-4" /> New clan
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clans.map((clan) => (
              <ClanCard key={clan.clanId} clan={clan} />
            ))}
          </div>

          <Card>
            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Got an invite code?</p>
                <p className="text-sm text-muted-foreground">
                  Join a friend&apos;s clan to start betting.
                </p>
              </div>
              <div className="sm:w-72">
                <JoinByCodeBox />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 py-12 text-center">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">No clans yet</h1>
        <p className="mt-2 text-muted-foreground">
          A clan is your private prediction pool. Start one and invite your crew, or
          jump into a friend&apos;s with their invite code.
        </p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Card className="text-left">
          <CardHeader>
            <PlusCircle className="h-7 w-7 text-primary" />
            <CardTitle className="mt-1">Create a clan</CardTitle>
            <CardDescription>
              Set the starting balance, max bet, and the rules of chaos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/clans/new">
              <Button className="w-full">Create your clan</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="text-left">
          <CardHeader>
            <Ticket className="h-7 w-7 text-primary" />
            <CardTitle className="mt-1">Join with a code</CardTitle>
            <CardDescription>Got an invite code from a friend? Drop it here.</CardDescription>
          </CardHeader>
          <CardContent>
            <JoinByCodeBox />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
