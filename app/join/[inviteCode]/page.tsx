import Link from "next/link";
import { Trophy, Users } from "lucide-react";
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
          <CardTitle>This invite isn&apos;t valid</CardTitle>
          <CardDescription>
            The link may be mistyped or the clan may no longer exist. Ask a clan member for a fresh
            invite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={profile ? "/dashboard" : "/"}>
            <Button variant="outline">{profile ? "Back to dashboard" : "Back home"}</Button>
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
      <CardHeader>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-accent/30 px-3 py-1 text-xs font-semibold text-accent-foreground">
          <Trophy className="h-3.5 w-3.5" /> You&apos;re invited
        </span>
        <CardTitle className="mt-2 text-2xl">{clan.name}</CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {clan.memberCount} {clan.memberCount === 1 ? "member" : "members"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Currency</dt>
            <dd className="mt-0.5 font-semibold">{clan.currencyName}</dd>
          </div>
          <div className="rounded-md bg-muted p-3">
            <dt className="text-xs text-muted-foreground">You&apos;ll start with</dt>
            <dd className="mt-0.5 font-semibold">
              {format(clan.startingBalance, clan.currencyName)}
            </dd>
          </div>
        </dl>

        {profile ? (
          <ClanJoinButton inviteCode={inviteCode} />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Log in or sign up to join the fun.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href={`/login?next=/join/${inviteCode}`} className="sm:flex-1">
                <Button className="w-full">Log in</Button>
              </Link>
              <Link href="/signup" className="sm:flex-1">
                <Button variant="outline" className="w-full">
                  Sign up
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
