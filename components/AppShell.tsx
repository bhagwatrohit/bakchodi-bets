import Link from "next/link";
import { signOutAction } from "@/app/actions/session";
import type { SessionProfile } from "@/lib/types";

const EDITION_DATE = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(new Date());

/**
 * The masthead. Every authenticated page sits under "THE DAILY DEGEN".
 * Pass the signed-in profile to show the byline + sign-out.
 */
export function AppShell({
  profile,
  children,
}: {
  profile: SessionProfile | null;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b-2 border-ink bg-paper">
        <div className="mx-auto max-w-5xl px-4">
          {/* top dateline rail */}
          <div className="flex items-center justify-between border-b border-hairline py-1.5 dateline">
            <span>Vol. I · No. 42</span>
            <span className="hidden sm:inline">{EDITION_DATE}</span>
            <span>Price: 0¢ · No Cash Value</span>
          </div>

          {/* masthead */}
          <div className="flex flex-col items-center py-3 text-center">
            <Link href={profile ? "/dashboard" : "/"} className="block">
              <h1 className="headline text-4xl sm:text-6xl tracking-tight">
                The Daily Degen
              </h1>
            </Link>
            <p className="kicker mt-1">
              The Bakchodi Bets Gazette · Fictional Credits Only
            </p>
          </div>
        </div>

        {/* nav rail */}
        <div className="border-t-2 border-ink bg-ink text-paper">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-1.5">
            <nav className="flex items-center gap-4 font-condensed uppercase tracking-widest text-xs">
              <Link href="/dashboard" className="hover:text-accent">
                Front Page
              </Link>
            </nav>
            {profile ? (
              <div className="flex items-center gap-4 font-condensed uppercase tracking-widest text-xs">
                <span className="hidden text-paper/70 sm:inline">
                  By {profile.displayName}
                </span>
                <form action={signOutAction}>
                  <button type="submit" className="hover:text-accent cursor-pointer uppercase">
                    Sign out
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-4 font-condensed uppercase tracking-widest text-xs">
                <Link href="/login" className="hover:text-accent">
                  Log in
                </Link>
                <Link href="/signup" className="hover:text-accent">
                  Subscribe
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-7">{children}</main>
    </>
  );
}
