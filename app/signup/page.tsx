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
    <div className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Join the chaos</CardTitle>
          <CardDescription>No cash. Only bragging rights.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <AuthForm mode="signup" action={signUpAction} next={next} />
          <Disclaimer variant="inline" />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href={loginHref} className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
