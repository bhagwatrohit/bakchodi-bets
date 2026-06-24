import Link from "next/link";
import { signOutAction } from "@/app/actions/session";
import { Trophy } from "@/components/Trophy";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { SessionProfile } from "@/lib/types";

/**
 * App header. Every authenticated page sits under it.
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
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href={profile ? "/dashboard" : "/"} className="flex items-center gap-2.5">
            <Trophy className="h-7 w-7" />
            <span className="flex flex-col leading-none">
              <span className="text-base font-extrabold tracking-tight sm:text-lg">
                Bakchodi<span className="text-primary"> Bets</span>
              </span>
              <span className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
                World Cup ’26 prediction pool
              </span>
            </span>
          </Link>

          {profile ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-muted-foreground sm:inline">{profile.displayName}</span>
              <ThemeToggle />
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="cursor-pointer font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Log out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <ThemeToggle />
              <Link href="/login" className="font-medium text-muted-foreground hover:text-foreground">
                Log in
              </Link>
              <Link
                href="/signup"
                className="font-semibold text-primary hover:opacity-80"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
        {profile ? (
          <div className="border-t border-border">
            <div className="mx-auto max-w-5xl px-4 py-1.5">
              <Link
                href="/dashboard"
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                ← All pools
              </Link>
            </div>
          </div>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
