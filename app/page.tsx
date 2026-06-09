import Link from "next/link";
import { Trophy, Users, Coins, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Disclaimer } from "@/components/Disclaimer";
import { getSessionProfile } from "@/lib/services/auth";

export default async function LandingPage() {
  const profile = await getSessionProfile();

  return (
    <div className="flex-1">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 font-extrabold">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Trophy className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight">Bakchodi Bets</span>
        </div>
        <div className="flex items-center gap-2">
          {profile ? (
            <Link href="/dashboard">
              <Button size="sm">Go to dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-12 pt-10 text-center sm:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/30 px-3 py-1 text-xs font-semibold text-accent-foreground">
          <Swords className="h-3.5 w-3.5" /> Fake money. Real bragging rights.
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Run a private World Cup prediction pool with your friends.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Create a clan, invite your friends, bet fake credits, settle matches, and
          fight for bragging rights.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={profile ? "/clans/new" : "/signup"}>
            <Button size="lg">Create your clan</Button>
          </Link>
          <Link href={profile ? "/dashboard" : "/login"}>
            <Button size="lg" variant="outline">
              Join with invite code
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-16 sm:grid-cols-3">
        {[
          {
            icon: Users,
            title: "Your crew, your rules",
            body: "Spin up a private clan, set the starting balance, max bet, and bet-visibility rules.",
          },
          {
            icon: Coins,
            title: "Pot-split payouts",
            body: "Winners split the losing pot in proportion to their stake. Just like the old spreadsheet.",
          },
          {
            icon: Trophy,
            title: "Leaderboard of shame",
            body: "Track balances, wins, losses, and biggest hits. Settle the chaos every match.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardContent className="pt-6">
              <Icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-2xl px-4 pb-16">
        <Disclaimer variant="inline" />
      </section>
    </div>
  );
}
