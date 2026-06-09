import Link from "next/link";
import { Trophy } from "lucide-react";
import { signOutAction } from "@/app/actions/session";
import { Button } from "@/components/ui/button";
import type { SessionProfile } from "@/lib/types";

/**
 * Authenticated app chrome: top bar + page container.
 * Pass the signed-in profile to show the user + sign-out.
 * Use on authenticated pages; the root layout renders the footer disclaimer.
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
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href={profile ? "/dashboard" : "/"} className="flex items-center gap-2 font-extrabold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Trophy className="h-5 w-5" />
            </span>
            <span className="text-lg tracking-tight">Bakchodi Bets</span>
          </Link>
          {profile ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {profile.displayName}
              </span>
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
