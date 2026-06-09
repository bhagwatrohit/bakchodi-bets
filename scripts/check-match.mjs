// Inspect any match that has bets: status, the wagers, payouts, and current
// member balances. Run it BEFORE and AFTER closing a match to confirm the
// settle/close loop worked.
//
//   node scripts/check-match.mjs            # all matches that have bets
//   node scripts/check-match.mjs "Bakchodi" # filter by match title substring
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const filter = process.argv[2];

const money = (v) =>
  Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const matches = await sql`
  select m.id, m.clan_id, m.title, m.status, m.winning_outcome_id, m.starts_at, c.currency_name
  from matches m
  join clans c on c.id = m.clan_id
  where exists (select 1 from bets b where b.match_id = m.id)
    ${filter ? sql`and m.title ilike ${"%" + filter + "%"}` : sql``}
  order by m.starts_at`;

const clanIds = [...new Set(matches.map((m) => m.clan_id))];

if (matches.length === 0) {
  console.log("No matches have any bets yet. (Place a wager, then re-run.)");
  await sql.end();
  process.exit(0);
}

for (const m of matches) {
  const bets = await sql`
    select p.display_name, o.label as pick, b.stake, b.status, b.payout, b.profit
    from bets b
    join profiles p on p.id = b.user_id
    join match_outcomes o on o.id = b.outcome_id
    where b.match_id = ${m.id}
    order by b.created_at`;
  const winning = m.winning_outcome_id
    ? (await sql`select label from match_outcomes where id = ${m.winning_outcome_id}`)[0]?.label
    : null;
  const pot = bets.reduce((s, b) => s + Number(b.stake), 0);

  console.log("\n" + "═".repeat(60));
  console.log(`  ${m.title}`);
  console.log(`  STATUS: ${m.status.toUpperCase()}${winning ? `  ·  WINNER: ${winning}` : ""}`);
  console.log(`  POT: ${money(pot)} ${m.currency_name}  ·  ${bets.length} wager(s)`);
  console.log("─".repeat(60));
  console.log(
    "  " +
      ["PLAYER", "PICK", "STAKE", "STATUS", "PAYOUT", "PROFIT"]
        .map((h, i) => h.padEnd([10, 14, 8, 9, 10, 8][i]))
        .join(""),
  );
  for (const b of bets) {
    console.log(
      "  " +
        [
          b.display_name.padEnd(10),
          b.pick.padEnd(14),
          money(b.stake).padEnd(8),
          b.status.toUpperCase().padEnd(9),
          money(b.payout).padEnd(10),
          (Number(b.profit) >= 0 ? "+" : "") + money(b.profit),
        ].join(""),
    );
  }
}

console.log("\n" + "═".repeat(60));
console.log("  CURRENT STANDINGS");
console.log("─".repeat(60));
const standings = await sql`
  select p.display_name, cm.balance, c.currency_name, c.starting_balance
  from clan_members cm
  join profiles p on p.id = cm.user_id
  join clans c on c.id = cm.clan_id
  where cm.clan_id = any(${clanIds})
  order by cm.balance desc`;
for (const s of standings) {
  const net = Number(s.balance) - Number(s.starting_balance);
  console.log(
    `  ${s.display_name.padEnd(10)} ${money(s.balance).padStart(10)} ${s.currency_name}` +
      `   (${net >= 0 ? "+" : ""}${money(net)})`,
  );
}
console.log("");

await sql.end();
