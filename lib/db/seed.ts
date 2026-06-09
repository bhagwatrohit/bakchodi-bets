import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

/*
  Idempotent local seed data. Safe to run multiple times.
  Self-contained DB client (does not import lib/db/index.ts, which is server-only).

  Seeds:
    - clan "Bakchodi World Cup" (Bakchodi Bucks, 1000 start, 100 max bet)
    - members Rohit (admin), Ankit, Sumit, Ritika — all password "password"
    - 4 matches, each with outcomes [Team A, Draw, Team B]
*/

const SEED_INVITE = "WORLDCUP";
const PASSWORD = "password";

const SEED_USERS = [
  { displayName: "Rohit", email: "rohit@bakchodi.test", role: "admin" as const },
  { displayName: "Ankit", email: "ankit@bakchodi.test", role: "member" as const },
  { displayName: "Sumit", email: "sumit@bakchodi.test", role: "member" as const },
  { displayName: "Ritika", email: "ritika@bakchodi.test", role: "member" as const },
];

const SEED_MATCHES = [
  { teamA: "Argentina", teamB: "Brazil", daysFromNow: 1 },
  { teamA: "India", teamB: "Pakistan", daysFromNow: 2 },
  { teamA: "Germany", teamB: "France", daysFromNow: 3 },
  { teamA: "USA", teamB: "Mexico", daysFromNow: 4 },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const now = Date.now();

  // Upsert profiles + credentials.
  const profileIds: Record<string, string> = {};
  for (const u of SEED_USERS) {
    const existingCred = await db.query.authCredentials.findFirst({
      where: eq(schema.authCredentials.email, u.email),
    });
    if (existingCred) {
      profileIds[u.email] = existingCred.profileId;
      continue;
    }
    const [profile] = await db
      .insert(schema.profiles)
      .values({ displayName: u.displayName })
      .returning({ id: schema.profiles.id });
    await db.insert(schema.authCredentials).values({
      profileId: profile.id,
      email: u.email,
      passwordHash,
    });
    profileIds[u.email] = profile.id;
  }

  const adminId = profileIds[SEED_USERS[0].email];

  // Upsert clan.
  let clan = await db.query.clans.findFirst({
    where: eq(schema.clans.inviteCode, SEED_INVITE),
  });
  if (!clan) {
    [clan] = await db
      .insert(schema.clans)
      .values({
        name: "Bakchodi World Cup",
        createdBy: adminId,
        currencyName: "Bakchodi Bucks",
        startingBalance: "1000",
        defaultMaxBet: "100",
        inviteCode: SEED_INVITE,
      })
      .returning();
  }

  // Memberships + initial ledger.
  for (const u of SEED_USERS) {
    const userId = profileIds[u.email];
    const alreadyInClan = await db.query.clanMembers.findFirst({
      where: and(
        eq(schema.clanMembers.clanId, clan.id),
        eq(schema.clanMembers.userId, userId),
      ),
    });
    if (alreadyInClan) continue;
    await db.insert(schema.clanMembers).values({
      clanId: clan.id,
      userId,
      role: u.role,
      balance: "1000",
    });
    await db.insert(schema.ledgerEntries).values({
      clanId: clan.id,
      userId,
      transactionType: "initial_balance",
      amount: "1000",
      balanceAfter: "1000",
      reason: "Seed data",
      createdBy: adminId,
    });
  }

  // Matches + outcomes.
  const existingMatches = await db.query.matches.findMany({
    where: eq(schema.matches.clanId, clan.id),
  });
  if (existingMatches.length === 0) {
    for (const m of SEED_MATCHES) {
      const startsAt = new Date(now + m.daysFromNow * 24 * 60 * 60 * 1000);
      const [match] = await db
        .insert(schema.matches)
        .values({
          clanId: clan.id,
          title: `${m.teamA} vs ${m.teamB}`,
          teamA: m.teamA,
          teamB: m.teamB,
          startsAt,
          status: "open",
          createdBy: adminId,
        })
        .returning({ id: schema.matches.id });
      await db.insert(schema.matchOutcomes).values([
        { matchId: match.id, label: m.teamA, sortOrder: 0 },
        { matchId: match.id, label: "Draw", sortOrder: 1 },
        { matchId: match.id, label: m.teamB, sortOrder: 2 },
      ]);
    }
  }

  console.log("Seed complete.");
  console.log(`  Clan: Bakchodi World Cup  (invite code: ${SEED_INVITE})`);
  console.log(`  Logins (password "${PASSWORD}"):`);
  for (const u of SEED_USERS) console.log(`    ${u.email}  [${u.role}]`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
