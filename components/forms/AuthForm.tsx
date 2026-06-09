"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthState } from "@/app/actions/auth";

type AuthAction = (prev: AuthState, formData: FormData) => Promise<AuthState>;

export function AuthForm({
  mode,
  action,
  next,
}: {
  mode: "login" | "signup";
  action: AuthAction;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {isSignup ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="displayName">Byline name</Label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            placeholder="What should your clan call you?"
            required
            minLength={2}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder={isSignup ? "At least 8 characters" : "••••••••"}
          required
          minLength={isSignup ? 8 : undefined}
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="border-2 border-danger px-3 py-2 font-condensed uppercase tracking-wide text-sm text-danger"
        >
          ✶ Stop the presses — {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending
          ? isSignup
            ? "Issuing press pass…"
            : "Stamping ticket…"
          : isSignup
            ? "Get my press pass"
            : "Punch the ticket"}
      </Button>
    </form>
  );
}
