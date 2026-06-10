import Link from "next/link";
import { signOutAction } from "@/app/actions/session";
import { Trophy } from "@/components/Trophy";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { SessionProfile } from "@/lib/types";

/**
 * Arcade cabinet header. Every authenticated page sits under the marquee.
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
      <header className="border-b-2 border-neon-cyan box-glow bg-bg-2/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href={profile ? "/dashboard" : "/"} className="flex items-center gap-3">
            <Trophy className="h-9 w-9" />
            <span className="flex flex-col leading-none">
              <span className="font-pixel text-sm sm:text-lg text-neon-green glow-green">
                BAKCHODI<span className="text-neon-magenta glow-magenta"> BETS</span>
              </span>
              <span className="mt-1 hidden font-condensed uppercase tracking-[0.25em] text-xs text-neon-amber sm:block">
                Khoob Khelo, Khoob Jeeto
              </span>
            </span>
          </Link>

          {profile ? (
            <div className="flex items-center gap-3 font-pixel text-[0.6rem] uppercase">
              <span className="hidden text-neon-cyan sm:inline">1P · {profile.displayName}</span>
              <ThemeToggle />
              <form action={signOutAction}>
                <button type="submit" className="cursor-pointer text-muted-foreground hover:text-neon-pink">
                  Quit
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3 font-pixel text-[0.6rem] uppercase">
              <ThemeToggle />
              <Link href="/login" className="text-neon-cyan hover:glow-cyan">
                Log in
              </Link>
              <Link href="/signup" className="text-neon-green hover:glow-green">
                Insert coin
              </Link>
            </div>
          )}
        </div>
        {profile ? (
          <div className="border-t-2 border-grid bg-background/60">
            <div className="mx-auto max-w-5xl px-4 py-1.5">
              <Link
                href="/dashboard"
                className="font-pixel text-[0.55rem] uppercase text-neon-cyan hover:glow-cyan"
              >
                « Select Game
              </Link>
            </div>
          </div>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-7">{children}</main>
    </>
  );
}
