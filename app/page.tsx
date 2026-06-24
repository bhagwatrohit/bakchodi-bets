import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/Disclaimer";
import { Trophy } from "@/components/Trophy";
import { Flag } from "@/components/Flag";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getSessionProfile } from "@/lib/services/auth";

const TICKER = [
  "Mexico",
  "Brazil",
  "Argentina",
  "France",
  "Germany",
  "Spain",
  "England",
  "United States",
  "Portugal",
  "Japan",
  "Morocco",
  "Netherlands",
];

export default async function LandingPage() {
  const profile = await getSessionProfile();

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex justify-end pt-3">
          <ThemeToggle />
        </div>
        {/* Marquee */}
        <div className="flex flex-col items-center pt-4 text-center sm:pt-10">
          <Trophy className="h-20 w-20" />
          <h1 className="headline mt-5 text-2xl sm:text-4xl">
            Bakchodi <span className="text-primary">Bets</span>
          </h1>
          <p className="kicker mt-3">World Cup &apos;26 prediction pool</p>
        </div>

        {/* flag ticker */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 border-y border-border py-3">
          {TICKER.map((t) => (
            <Flag key={t} team={t} size="md" className="border-border" />
          ))}
        </div>

        {/* Pitch */}
        <div className="mt-9 text-center">
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-foreground">
            Run a private World Cup prediction pool with your friends. Spin up a
            clan, talk trash, bet fake credits, settle the matches, and climb
            the leaderboard.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={profile ? "/clans/new" : "/signup"} className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">Start your clan</Button>
          </Link>
          <Link href={profile ? "/dashboard" : "/login"} className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Join with code
            </Button>
          </Link>
        </div>

        {/* How it plays */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            ["Your crew, your rules", "Set the bankroll, the max bet, and who can peek at the wagers."],
            ["Pot-split payouts", "Winners carve up the losing pot in proportion to their stake."],
            ["Leaderboard", "Wins, losses, biggest hits — all tracked on the leaderboard."],
          ].map(([h, b]) => (
            <div key={h} className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-pixel text-base text-foreground leading-relaxed">
                {h}
              </h3>
              <p className="mt-2 text-base text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 pb-12">
          <Disclaimer variant="inline" />
        </div>
      </div>
    </div>
  );
}
