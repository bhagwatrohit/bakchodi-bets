import Link from "next/link";
import { getSessionProfile } from "@/lib/services/auth";
import { getClanForInvite } from "@/lib/services/clans";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Disclaimer } from "@/components/Disclaimer";
import { ClanJoinButton } from "@/components/ClanJoinButton";
import { format } from "@/lib/money";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const [profile, clan] = await Promise.all([
    getSessionProfile(),
    getClanForInvite(inviteCode),
  ]);

  // --- Invalid invite ---
  if (!clan) {
    const body = (
      <Card>
        <CardHeader>
          <p className="kicker text-neon-pink">Invalid Code</p>
          <CardTitle className="mt-1">Game Not Found</CardTitle>
          <CardDescription>
            The link may be mistyped or the clan may no longer exist. Ask a clan member for a fresh
            invite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={profile ? "/dashboard" : "/"}>
            <Button variant="outline">{profile ? "Back to Dashboard" : "Back to Start"}</Button>
          </Link>
        </CardContent>
      </Card>
    );
    if (profile) {
      return (
        <AppShell profile={profile}>
          <div className="mx-auto max-w-md">{body}</div>
        </AppShell>
      );
    }
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{body}</div>
      </div>
    );
  }

  // --- Preview card (shared by both states) ---
  const preview = (
    <Card>
      <CardHeader className="text-center">
        <p className="kicker text-neon-cyan">You&apos;re Invited · Join Game</p>
        <hr className="rule-thick my-2" />
        <CardTitle className="headline text-3xl normal-case tracking-tight">{clan.name}</CardTitle>
        <CardDescription className="dateline not-italic">
          {clan.memberCount} {clan.memberCount === 1 ? "Player" : "Players"} in the Game
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-3 divide-x divide-grid border-y-2 border-grid text-center">
          <div className="px-2 py-3">
            <dt className="kicker">Players</dt>
            <dd className="tabular mt-1 text-lg font-semibold">{clan.memberCount}</dd>
          </div>
          <div className="px-2 py-3">
            <dt className="kicker">Currency</dt>
            <dd className="mt-1 font-condensed uppercase tracking-wide text-lg font-semibold">
              {clan.currencyName}
            </dd>
          </div>
          <div className="px-2 py-3">
            <dt className="kicker">Starting Credits</dt>
            <dd className="tabular mt-1 text-lg font-semibold">
              {format(clan.startingBalance, clan.currencyName)}
            </dd>
          </div>
        </dl>

        {profile ? (
          <ClanJoinButton inviteCode={inviteCode} />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Log in or sign up to claim your spot in the game.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href={`/login?next=/join/${inviteCode}`} className="sm:flex-1">
                <Button className="w-full">Log in</Button>
              </Link>
              <Link href="/signup" className="sm:flex-1">
                <Button variant="outline" className="w-full">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        )}

        <Disclaimer variant="inline" />
      </CardContent>
    </Card>
  );

  if (profile) {
    return (
      <AppShell profile={profile}>
        <div className="mx-auto max-w-md">{preview}</div>
      </AppShell>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">{preview}</div>
    </div>
  );
}
