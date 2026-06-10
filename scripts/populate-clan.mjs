// Populate an existing clan with the real 2026 World Cup fixtures, three demo
// friends, and a ready-to-settle demo match. Idempotent.
//
//   node scripts/populate-clan.mjs [INVITE_CODE]   (default: GKVCUKPF)
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

config({ path: ".env.local", quiet: true });
const here = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(
  readFileSync(resolve(here, "wc2026-fixtures.json"), "utf8"),
).matches;

const invite = process.argv[2] || "GKVCUKPF";
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const [clan] = await sql`select * from clans where invite_code = ${invite}`;
if (!clan) {
  console.error(`No clan with invite code ${invite}`);
  await sql.end();
  process.exit(1);
}
console.log(`Populating clan "${clan.name}" (${invite})…`);

const admin = (
  await sql`select user_id from clan_members where clan_id = ${clan.id} and role = 'admin' limit 1`
)[0]?.user_id;

// --- friends as members (so the demo bets have bettors) ---
const FRIENDS = [
  { name: "Ankit", email: "ankit@bakchodi.test" },
  { name: "Sumit", email: "sumit@bakchodi.test" },
  { name: "Ritika", email: "ritika@bakchodi.test" },
];
const pwHash = await bcrypt.hash("password", 10);
const idByEmail = {};
for (const f of FRIENDS) {
  let cred = (await sql`select profile_id from auth_credentials where email = ${f.email}`)[0];
  if (!cred) {
    const [p] = await sql`insert into profiles (display_name) values (${f.name}) returning id`;
    await sql`insert into auth_credentials (profile_id, email, password_hash) values (${p.id}, ${f.email}, ${pwHash})`;
    cred = { profile_id: p.id };
  }
  idByEmail[f.email] = cred.profile_id;
  const member = (
    await sql`select id from clan_members where clan_id = ${clan.id} and user_id = ${cred.profile_id}`
  )[0];
  if (!member) {
    await sql`insert into clan_members (clan_id, user_id, role, balance)
              values (${clan.id}, ${cred.profile_id}, 'member', ${clan.starting_balance})`;
    await sql`insert into ledger_entries (clan_id, user_id, transaction_type, amount, balance_after, reason, created_by)
              values (${clan.id}, ${cred.profile_id}, 'initial_balance', ${clan.starting_balance}, ${clan.starting_balance}, 'Joined clan', ${admin})`;
  }
}

// --- 72 World Cup fixtures (only if the clan has no WC matches yet) ---
const existing = await sql`select count(*)::int as n from matches where clan_id = ${clan.id}`;
if (existing[0].n === 0) {
  for (const m of fixtures) {
    const startsAt = new Date(`${m.date}T${m.kickoff_et}:00-04:00`);
    const [match] = await sql`
      insert into matches (clan_id, title, team_a, team_b, starts_at, status, created_by)
      values (${clan.id}, ${`${m.team_a} vs ${m.team_b}`}, ${m.team_a}, ${m.team_b}, ${startsAt}, 'open', ${admin})
      returning id`;
    await sql`insert into match_outcomes (match_id, label, sort_order) values
      (${match.id}, ${m.team_a}, 0), (${match.id}, 'Draw', 1), (${match.id}, ${m.team_b}, 2)`;
  }
  console.log(`  + ${fixtures.length} World Cup fixtures`);
} else {
  console.log(`  (clan already has ${existing[0].n} matches — skipped fixtures)`);
}

// --- Grand Gala: pick the World Cup champion (fixed entry, open until knockouts) ---
const galaExists = (
  await sql`select id from matches where clan_id = ${clan.id} and market_type = 'tournament_winner'`
)[0];
if (!galaExists) {
  const teams = [...new Set(fixtures.flatMap((f) => [f.team_a, f.team_b]))].sort((a, b) =>
    a.localeCompare(b),
  );
  const [gala] = await sql`
    insert into matches (clan_id, title, team_a, team_b, starts_at, status, market_type, fixed_stake, created_by)
    values (${clan.id}, 'World Cup Winner', 'World Cup', 'Champion', ${new Date("2026-06-28T12:00:00-04:00")}, 'open', 'tournament_winner', ${clan.default_max_bet}, ${admin})
    returning id`;
  for (let i = 0; i < teams.length; i++) {
    await sql`insert into match_outcomes (match_id, label, sort_order) values (${gala.id}, ${teams[i]}, ${i})`;
  }
  console.log(`  + Grand Gala (World Cup winner) with ${teams.length} teams`);
} else {
  console.log(`  (Grand Gala already present — skipped)`);
}

// --- demo settle-test match with bets ---
const DEMO = "Bakchodi XI vs Internet FC";
const demoExists = (await sql`select id from matches where clan_id = ${clan.id} and title = ${DEMO}`)[0];
if (!demoExists) {
  const startsAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const [demo] = await sql`
    insert into matches (clan_id, title, team_a, team_b, starts_at, status, created_by)
    values (${clan.id}, ${DEMO}, 'Bakchodi XI', 'Internet FC', ${startsAt}, 'open', ${admin})
    returning id`;
  const outs = await sql`insert into match_outcomes (match_id, label, sort_order) values
    (${demo.id}, 'Bakchodi XI', 0), (${demo.id}, 'Draw', 1), (${demo.id}, 'Internet FC', 2) returning id, label`;
  const outId = (label) => outs.find((o) => o.label === label).id;
  const bets = [
    { email: "ankit@bakchodi.test", pick: "Bakchodi XI", stake: "100" },
    { email: "ritika@bakchodi.test", pick: "Bakchodi XI", stake: "50" },
    { email: "sumit@bakchodi.test", pick: "Internet FC", stake: "150" },
  ];
  for (const b of bets) {
    const uid = idByEmail[b.email];
    const [m] = await sql`select id, balance from clan_members where clan_id = ${clan.id} and user_id = ${uid}`;
    const newBal = (Number(m.balance) - Number(b.stake)).toString();
    const [bet] = await sql`
      insert into bets (clan_id, match_id, user_id, outcome_id, stake, status)
      values (${clan.id}, ${demo.id}, ${uid}, ${outId(b.pick)}, ${b.stake}, 'pending') returning id`;
    await sql`update clan_members set balance = ${newBal} where id = ${m.id}`;
    await sql`insert into ledger_entries (clan_id, user_id, bet_id, transaction_type, amount, balance_after, reason, created_by)
              values (${clan.id}, ${uid}, ${bet.id}, 'bet_placed', ${(-Number(b.stake)).toString()}, ${newBal}, ${`Bet on ${b.pick}`}, ${uid})`;
  }
  console.log(`  + demo match "${DEMO}" with 3 bets (ready to settle)`);
} else {
  console.log(`  (demo match already present — skipped)`);
}

console.log("Done.");
await sql.end();
