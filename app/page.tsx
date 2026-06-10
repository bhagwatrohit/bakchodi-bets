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
          <h1 className="headline mt-5 text-2xl sm:text-4xl">BAKCHODI BETS</h1>
          <p className="mt-4 font-condensed uppercase tracking-[0.3em] text-lg text-neon-amber glow-amber">
            Khoob Khelo, Khoob Jeeto
          </p>
          <p className="kicker mt-2">World Cup &apos;26 · Prediction Arcade</p>
        </div>

        {/* flag ticker */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 border-y-2 border-grid py-3">
          {TICKER.map((t) => (
            <Flag key={t} team={t} size="md" className="border-grid" />
          ))}
        </div>

        {/* Pitch */}
        <div className="mt-9 text-center">
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-phosphor">
            Run a private World Cup prediction pool with your friends. Spin up a
            clan, talk trash, bet fake credits, settle the matches, and grind for
            the top of the leaderboard.
          </p>
          <p className="mt-4 font-pixel text-[0.6rem] uppercase text-neon-amber blink">
            ▶ Insert fake coin to play
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={profile ? "/clans/new" : "/signup"}>
            <Button size="lg">Start Your Clan</Button>
          </Link>
          <Link href={profile ? "/dashboard" : "/login"}>
            <Button size="lg" variant="outline">
              Join With Code
            </Button>
          </Link>
        </div>

        {/* How it plays */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            ["1·UP", "Your crew, your rules", "Set the bankroll, the max bet, and who can peek at the wagers."],
            ["POT", "Pot-split payouts", "Winners carve up the losing pot in proportion to their stake."],
            ["HI-SCORE", "Leaderboard of shame", "Wins, losses, biggest hits — all on the high-score board."],
          ].map(([tag, h, b]) => (
            <div key={h} className="border-2 border-grid bg-card p-4">
              <p className="font-pixel text-[0.55rem] text-neon-magenta glow-magenta">{tag}</p>
              <h3 className="mt-3 font-pixel text-[0.7rem] uppercase text-neon-green leading-relaxed">
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
