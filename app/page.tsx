import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/Disclaimer";
import { getSessionProfile } from "@/lib/services/auth";

const EDITION_DATE = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(new Date());

export default async function LandingPage() {
  const profile = await getSessionProfile();

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-5xl px-4">
        {/* Dateline rail */}
        <div className="flex items-center justify-between border-b border-hairline py-1.5 dateline">
          <span>Vol. I · No. 42</span>
          <span className="hidden sm:inline">{EDITION_DATE}</span>
          <span>Price: 0¢ · No Cash Value</span>
        </div>

        {/* Masthead */}
        <div className="border-b-2 border-ink py-5 text-center">
          <p className="kicker mb-1">Late City Final · Sports Desk</p>
          <h1 className="headline text-5xl sm:text-7xl">The Daily Degen</h1>
          <p className="mt-2 font-condensed uppercase tracking-[0.3em] text-xs text-ink-soft">
            The Bakchodi Bets Gazette
          </p>
        </div>

        {/* Lede + sidebar */}
        <div className="grid gap-0 border-b-2 border-ink md:grid-cols-3">
          <article className="border-ink p-5 md:col-span-2 md:border-r">
            <p className="kicker text-accent">Exclusive · Sports Pool</p>
            <h2 className="headline mt-2 text-3xl sm:text-5xl">
              Run a private World Cup prediction pool with your friends.
            </h2>
            <p className="dropcap mt-4 text-lg leading-relaxed">
              Create a clan, invite your friends, bet fake credits, settle
              matches, and fight for bragging rights. It&apos;s the old group-chat
              spreadsheet — finally given the front-page treatment it always
              deserved. No bookies. No cash. Just a permanent, public record of
              who called it and who choked.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href={profile ? "/clans/new" : "/signup"}>
                <Button size="lg">Start Your Clan</Button>
              </Link>
              <Link href={profile ? "/dashboard" : "/login"}>
                <Button size="lg" variant="outline">
                  Join With Invite Code
                </Button>
              </Link>
            </div>
          </article>

          <aside className="p-5">
            <p className="kicker border-b border-ink pb-1">In This Edition</p>
            <ul className="mt-3 flex flex-col divide-y divide-hairline">
              {[
                ["Your crew, your rules", "Set the starting bankroll, max bet, and who sees which wagers."],
                ["Pot-split payouts", "Winners carve up the losing pot in proportion to their stake."],
                ["Leaderboard of Shame", "Standings, wins, losses, and biggest hits — on the record."],
              ].map(([h, b]) => (
                <li key={h} className="py-2">
                  <h3 className="font-condensed uppercase tracking-wide text-sm font-semibold">
                    {h}
                  </h3>
                  <p className="text-sm italic text-ink-soft">{b}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        {/* Example "betting line" strip */}
        <div className="grid grid-cols-1 gap-0 border-b-2 border-ink sm:grid-cols-3">
          {[
            ["Argentina v Brazil", "Tonight · 8:00"],
            ["Germany v France", "Tomorrow · 5:00"],
            ["USA v Mexico", "Sat · 3:30"],
          ].map(([m, t], i) => (
            <div
              key={m}
              className={`p-4 ${i < 2 ? "border-b sm:border-b-0 sm:border-r border-hairline" : ""}`}
            >
              <p className="dateline">{t}</p>
              <p className="headline text-xl">{m}</p>
              <p className="mt-1 text-xs italic text-ink-soft">Lines open · place your wager</p>
            </div>
          ))}
        </div>

        <div className="py-6">
          <Disclaimer variant="inline" />
        </div>
      </div>
    </div>
  );
}
