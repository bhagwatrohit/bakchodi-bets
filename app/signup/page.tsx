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
      <div className="mb-5 border-b border-border pb-3 text-center">
        <p className="kicker">Sign up</p>
        <h1 className="headline mt-1 text-2xl sm:text-3xl">Enter the chaos.</h1>
        <p className="mt-2 text-base text-muted-foreground">
          No cash. Only bragging rights and a spot on the leaderboard.
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Sign up</CardTitle>
          <CardDescription>Sign up to start your own clans.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <AuthForm mode="signup" action={signUpAction} next={next} />
          <Disclaimer variant="inline" />
          <hr className="rule-hair" />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href={loginHref} className="text-primary underline underline-offset-4 hover:text-primary">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
