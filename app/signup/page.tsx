import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/forms/AuthForm";
import { Disclaimer } from "@/components/Disclaimer";
import { signUpAction } from "@/app/actions/auth";
import { getSessionProfile } from "@/lib/services/auth";

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const profile = await getSessionProfile();
  const { next: nextRaw } = await searchParams;
  const next = firstParam(nextRaw);

  if (profile) redirect(next && next.startsWith("/") ? next : "/dashboard");

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      <div className="mb-5 border-b-2 border-ink pb-3 text-center">
        <p className="dateline">New Readership · Open Enrollment</p>
        <p className="kicker mt-2 text-accent">Get Your Press Pass</p>
        <h1 className="headline mt-1 text-4xl">Subscribe to the chaos.</h1>
        <p className="mt-2 text-sm italic text-ink-soft">
          No cash. Only bragging rights, printed in full.
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Subscribe</CardTitle>
          <CardDescription>Sign up to start your own clans.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <AuthForm mode="signup" action={signUpAction} next={next} />
          <Disclaimer variant="inline" />
          <hr className="rule-hair" />
          <p className="text-center font-condensed uppercase tracking-wide text-sm text-ink-soft">
            Already on the masthead?{" "}
            <Link href={loginHref} className="text-accent underline underline-offset-4 decoration-2 hover:text-ink">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
