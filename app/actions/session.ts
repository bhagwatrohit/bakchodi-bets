"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/lib/services/auth";

/** Sign the current user out and send them home. Used by AppShell. */
export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/");
}
