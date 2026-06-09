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
    <div className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Log in to get back to your clans.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <AuthForm mode="login" action={signInAction} next={next} />
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href={signupHref} className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
