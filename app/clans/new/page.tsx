import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/services/auth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Disclaimer } from "@/components/Disclaimer";
import { ClanCreateForm } from "@/components/ClanCreateForm";

export default async function NewClanPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?next=/clans/new");

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <p className="kicker text-primary">New clan</p>
          <h1 className="headline mt-1 text-3xl sm:text-4xl">Start a new clan</h1>
          <hr className="rule-thick mt-3" />
          <p className="mt-3 text-sm text-muted-foreground">
            Set the table, then invite your crew. You&apos;ll be the admin of
            record.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Clan setup</CardTitle>
            <CardDescription>You can tweak most of this later in clan settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <ClanCreateForm />
          </CardContent>
        </Card>
        <div className="mt-6">
          <Disclaimer variant="inline" />
        </div>
      </div>
    </AppShell>
  );
}
