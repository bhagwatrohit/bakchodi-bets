import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

/*
  Idempotent local seed data. Safe to run multiple times.
  Self-contained DB client (does not import lib/db/index.ts, which is server-only).

  Seeds:
    - clan "Bakchodi World Cup" (Bakchodi Bucks, 1000 start, 100 max bet)
    - members Rohit (admin), Ankit, Sumit, Ritika — all password "password"
    - the real 2026 FIFA World Cup group-stage fixtures (72 matches), each with
      outcomes [Team A, Draw, Team B]. Source: scripts/wc2026-fixtures.json.
*/

const SEED_INVITE = "WORLDCUP";
const PASSWORD = "password";

const SEED_USERS = [
  { displayName: "Rohit", email: "rohit@bakchodi.test", role: "admin" as const },
  { displayName: "Ankit", email: "ankit@bakchodi.test", role: "member" as const },
  { displayName: "Sumit", email: "sumit@bakchodi.test", role: "member" as const },
  { displayName: "Ritika", email: "ritika@bakchodi.test", role: "member" as const },
];

interface Fixture {
  group: string;
  date: string; // YYYY-MM-DD
  kickoff_et: string; // HH:MM, US Eastern
  venue: string;
  team_a: string;
  team_b: string;
}

interface Knockout {
  round: string;
  match_no: number;
  date: string;
  kickoff_et: string;
  venue: string;
  team_a: string;
  team_b: string;
}

function loadJson<T>(file: string): T[] {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = resolve(here, `../../scripts/${file}`);
  return (JSON.parse(readFileSync(path, "utf8")) as { matches: T[] }).matches;
}

// Real 2026 FIFA World Cup fixtures (kickoffs in US Eastern = EDT, UTC-4 in June/July).
const SEED_MATCHES = loadJson<Fixture>("wc2026-fixtures.json");
const SEED_KNOCKOUTS = loadJson<Knockout>("wc2026-knockouts.json");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

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
        defaultMinBet: "100",
        defaultMaxBet: "500",
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
      // Kickoff is US Eastern; June/July is EDT (UTC-4).
      const startsAt = new Date(`${m.date}T${m.kickoff_et}:00-04:00`);
      const [match] = await db
        .insert(schema.matches)
        .values({
          clanId: clan.id,
          title: `${m.team_a} vs ${m.team_b}`,
          teamA: m.team_a,
          teamB: m.team_b,
          startsAt,
          status: "open",
          stage: "group",
          groupLabel: m.group,
          createdBy: adminId,
        })
        .returning({ id: schema.matches.id });
      await db.insert(schema.matchOutcomes).values([
        { matchId: match.id, label: m.team_a, sortOrder: 0 },
        { matchId: match.id, label: "Draw", sortOrder: 1 },
        { matchId: match.id, label: m.team_b, sortOrder: 2 },
      ]);
    }

    // Knockout bracket — 32 matches, matchups TBD until groups finish, no Draw.
    for (const k of SEED_KNOCKOUTS) {
      const startsAt = new Date(`${k.date}T${k.kickoff_et}:00-04:00`);
      const [match] = await db
        .insert(schema.matches)
        .values({
          clanId: clan.id,
          title: `${k.round} · Match ${k.match_no}`,
          teamA: k.team_a,
          teamB: k.team_b,
          startsAt,
          status: "open",
          stage: "knockout",
          round: k.round,
          createdBy: adminId,
        })
        .returning({ id: schema.matches.id });
      await db.insert(schema.matchOutcomes).values([
        { matchId: match.id, label: k.team_a === "TBD" ? "TBD (A)" : k.team_a, sortOrder: 0 },
        { matchId: match.id, label: k.team_b === "TBD" ? "TBD (B)" : k.team_b, sortOrder: 1 },
      ]);
    }

    // Grand Gala: pick the World Cup champion (fixed entry stake, open until knockouts).
    const teams = [...new Set(SEED_MATCHES.flatMap((m) => [m.team_a, m.team_b]))].sort();
    const [gala] = await db
      .insert(schema.matches)
      .values({
        clanId: clan.id,
        title: "World Cup Winner",
        teamA: "World Cup",
        teamB: "Champion",
        startsAt: new Date("2026-06-28T12:00:00-04:00"),
        status: "open",
        marketType: "tournament_winner",
        fixedStake: "100",
        createdBy: adminId,
      })
      .returning({ id: schema.matches.id });
    await db
      .insert(schema.matchOutcomes)
      .values(teams.map((t, i) => ({ matchId: gala.id, label: t, sortOrder: i })));
  }

  // ---- Demo match: ready to settle, with bets already placed ----
  // Lets you test the close/settle loop end-to-end immediately. Mirrors the
  // classic pot-split example: Ankit 100 + Ritika 50 on Bakchodi XI vs Sumit
  // 150 on Internet FC. Settle "Bakchodi XI" as winner and watch the payouts.
  const DEMO_TITLE = "Bakchodi XI vs Internet FC";
  const demoExists = await db.query.matches.findFirst({
    where: and(eq(schema.matches.clanId, clan.id), eq(schema.matches.title, DEMO_TITLE)),
  });
  if (!demoExists) {
    const startsAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3h out, still open
    const [demo] = await db
      .insert(schema.matches)
      .values({
        clanId: clan.id,
        title: DEMO_TITLE,
        teamA: "Bakchodi XI",
        teamB: "Internet FC",
        startsAt,
        status: "open",
        createdBy: adminId,
      })
      .returning({ id: schema.matches.id });
    const demoOutcomes = await db
      .insert(schema.matchOutcomes)
      .values([
        { matchId: demo.id, label: "Bakchodi XI", sortOrder: 0 },
        { matchId: demo.id, label: "Draw", sortOrder: 1 },
        { matchId: demo.id, label: "Internet FC", sortOrder: 2 },
      ])
      .returning();
    const outcomeByLabel = (label: string) =>
      demoOutcomes.find((o) => o.label === label)!.id;

    const demoBets = [
      { email: "ankit@bakchodi.test", pick: "Bakchodi XI", stake: "100" },
      { email: "ritika@bakchodi.test", pick: "Bakchodi XI", stake: "50" },
      { email: "sumit@bakchodi.test", pick: "Internet FC", stake: "150" },
    ];
    for (const b of demoBets) {
      const userId = profileIds[b.email];
      const member = await db.query.clanMembers.findFirst({
        where: and(
          eq(schema.clanMembers.clanId, clan.id),
          eq(schema.clanMembers.userId, userId),
        ),
      });
      if (!member) continue;
      const newBalance = (Number(member.balance) - Number(b.stake)).toString();
      const [bet] = await db
        .insert(schema.bets)
        .values({
          clanId: clan.id,
          matchId: demo.id,
          userId,
          outcomeId: outcomeByLabel(b.pick),
          stake: b.stake,
          status: "pending",
        })
        .returning({ id: schema.bets.id });
      await db
        .update(schema.clanMembers)
        .set({ balance: newBalance })
        .where(eq(schema.clanMembers.id, member.id));
      await db.insert(schema.ledgerEntries).values({
        clanId: clan.id,
        userId,
        betId: bet.id,
        transactionType: "bet_placed",
        amount: (-Number(b.stake)).toString(),
        balanceAfter: newBalance,
        reason: `Bet on ${b.pick}`,
        createdBy: userId,
      });
    }
  }

  console.log("Seed complete.");
  console.log(`  Clan: Bakchodi World Cup  (invite code: ${SEED_INVITE})`);
  console.log(
    `  Matches: ${SEED_MATCHES.length} group + ${SEED_KNOCKOUTS.length} knockout (2026 FIFA World Cup) + 1 demo`,
  );
  console.log(`  Demo match "Bakchodi XI vs Internet FC" has 3 bets — settle it to test payouts.`);
  console.log(`  Logins (password "${PASSWORD}"):`);
  for (const u of SEED_USERS) console.log(`    ${u.email}  [${u.role}]`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
