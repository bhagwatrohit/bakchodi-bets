import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/forms/AuthForm";
import { signInAction } from "@/app/actions/auth";
import { getSessionProfile } from "@/lib/services/auth";

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const profile = await getSessionProfile();
  const { next: nextRaw } = await searchParams;
  const next = firstParam(nextRaw);

  if (profile) redirect(next && next.startsWith("/") ? next : "/dashboard");

  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      <div className="mb-5 border-b border-border pb-3 text-center">
        <p className="kicker">Log in</p>
        <h1 className="headline mt-1 text-2xl sm:text-3xl">Welcome back.</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Enter your credentials to get back to your clans.
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Log in</CardTitle>
          <CardDescription>Log in to get back to your clans.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <AuthForm mode="login" action={signInAction} next={next} />
          <hr className="rule-hair" />
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href={signupHref} className="text-primary underline underline-offset-4 hover:text-primary">
              Sign up.
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
