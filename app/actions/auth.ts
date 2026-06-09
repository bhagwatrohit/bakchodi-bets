"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth/session";
import { signIn, signUp } from "@/lib/services/auth";
import { ServiceError } from "@/lib/errors";

export type AuthState = { error?: string };

/** Only allow same-origin relative paths as redirect targets. */
function safeNext(next: unknown): string {
  const value = typeof next === "string" ? next : "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const next = safeNext(formData.get("next"));
  try {
    const { profileId } = await signUp({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
    });
    await createSession(profileId);
  } catch (e) {
    return { error: e instanceof ServiceError ? e.message : "Something went wrong." };
  }
  redirect(next); // OUTSIDE try/catch — redirect throws control-flow
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const next = safeNext(formData.get("next"));
  try {
    const { profileId } = await signIn({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    await createSession(profileId);
  } catch (e) {
    return { error: e instanceof ServiceError ? e.message : "Something went wrong." };
  }
  redirect(next); // OUTSIDE try/catch — redirect throws control-flow
}
