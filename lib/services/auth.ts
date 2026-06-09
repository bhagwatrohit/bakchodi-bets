import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { readSession, clearSession } from "@/lib/auth/session";
import { conflict, unauthorized, validation } from "@/lib/errors";
import type { SessionProfile } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Register a new profile + credentials. Does NOT set the session cookie —
 *  the calling Server Action does that (cookies can only be set there). */
export async function signUp(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ profileId: string }> {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();

  if (!EMAIL_RE.test(email)) throw validation("Please enter a valid email address.");
  if (input.password.length < 8) throw validation("Password must be at least 8 characters.");
  if (displayName.length < 2) throw validation("Please enter your name.");

  const existing = await db.query.authCredentials.findFirst({
    where: eq(schema.authCredentials.email, email),
  });
  if (existing) throw conflict("An account with that email already exists.");

  const passwordHash = await hashPassword(input.password);

  const profileId = await db.transaction(async (tx) => {
    const [profile] = await tx
      .insert(schema.profiles)
      .values({ displayName })
      .returning({ id: schema.profiles.id });
    await tx.insert(schema.authCredentials).values({
      profileId: profile.id,
      email,
      passwordHash,
    });
    return profile.id;
  });

  return { profileId };
}

/** Verify credentials. Does NOT set the session cookie (caller does). */
export async function signIn(input: {
  email: string;
  password: string;
}): Promise<{ profileId: string }> {
  const email = normalizeEmail(input.email);
  const cred = await db.query.authCredentials.findFirst({
    where: eq(schema.authCredentials.email, email),
  });
  if (!cred) throw validation("Incorrect email or password.");
  const ok = await verifyPassword(input.password, cred.passwordHash);
  if (!ok) throw validation("Incorrect email or password.");
  return { profileId: cred.profileId };
}

/** Current signed-in profile, or null. */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const profileId = await readSession();
  if (!profileId) return null;
  const profile = await db.query.profiles.findFirst({
    where: eq(schema.profiles.id, profileId),
  });
  if (!profile) return null;
  const cred = await db.query.authCredentials.findFirst({
    where: eq(schema.authCredentials.profileId, profile.id),
  });
  return {
    id: profile.id,
    displayName: profile.displayName,
    email: cred?.email ?? "",
  };
}

/** Like getSessionProfile but throws if not signed in. */
export async function requireSessionProfile(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) throw unauthorized();
  return profile;
}

/** Clear the session cookie. Must be called from a Server Action / Route Handler. */
export async function signOut(): Promise<void> {
  await clearSession();
}
