// Real-browser smoke of the JS bet-placement path (useActionState form).
// Sets a session cookie for Ritika, places a bet via the UI, asserts success.
import { chromium } from "playwright";
import { SignJWT } from "jose";
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const BASE = process.env.SMOKE_BASE || "http://localhost:3000";
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

function fail(msg) {
  console.error("❌ " + msg);
  process.exitCode = 1;
}

const [ritika] = await sql`select id from profiles where display_name = 'Ritika'`;
const [clan] = await sql`select id from clans where invite_code = 'WORLDCUP'`;
const [match] = await sql`
  select m.id from matches m
  where m.clan_id = ${clan.id} and m.status = 'open'
    and not exists (select 1 from bets b where b.match_id = m.id and b.user_id = ${ritika.id})
  order by m.starts_at limit 1`;
if (!match) { fail("no open match without a Ritika bet"); await sql.end(); process.exit(1); }

const token = await new SignJWT({ sub: ritika.id })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("604800s")
  .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

const [{ balance: balBefore }] = await sql`
  select balance from clan_members where clan_id = ${clan.id} and user_id = ${ritika.id}`;
console.log(`Ritika balance before: ${balBefore}`);

const browser = await chromium.launch();
const ctx = await browser.newContext();
await ctx.addCookies([{
  name: "bb_session", value: token, domain: "localhost", path: "/",
  httpOnly: true, sameSite: "Lax",
}]);
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));

const url = `${BASE}/clans/${clan.id}/matches/${match.id}`;
await page.goto(url, { waitUntil: "networkidle" });

// The bet form must be present.
const lockBtn = page.getByRole("button", { name: /lock it in/i });
if ((await lockBtn.count()) === 0) { fail("BetForm 'Lock it in' button not found"); }

// Select the first outcome chip, fill stake, submit.
await page.locator('form:has(input[name="stake"]) button[type="button"]').first().click();
await page.fill('input[name="stake"]', "100");

const [postResp] = await Promise.all([
  page.waitForResponse(
    (r) => r.request().method() === "POST" && r.url().includes(`/matches/${match.id}`),
    { timeout: 10000 },
  ).catch(() => null),
  lockBtn.click(),
]);

if (!postResp) fail("No POST request fired on submit (JS path) — THIS would confirm the reported bug");
else console.log(`✅ POST fired: ${postResp.status()}`);

// Wait for the success toast.
const toast = page.getByText(/bet placed/i);
const toastSeen = await toast.waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
console.log(toastSeen ? "✅ Success toast shown" : "⚠️ toast not observed");

// Verify DB side effect.
await new Promise((r) => setTimeout(r, 800));
const [{ balance: balAfter }] = await sql`
  select balance from clan_members where clan_id = ${clan.id} and user_id = ${ritika.id}`;
const [bet] = await sql`
  select stake, status from bets where match_id = ${match.id} and user_id = ${ritika.id}`;
console.log(`Ritika balance after: ${balAfter}`);
console.log(`Bet row: ${bet ? `${bet.stake} ${bet.status}` : "NONE"}`);

if (Number(balBefore) - Number(balAfter) === 100 && bet && bet.status === "pending") {
  console.log("✅ JS bet path WORKS: balance debited 100, bet pending.");
} else {
  fail(`Unexpected state: before=${balBefore} after=${balAfter} bet=${JSON.stringify(bet)}`);
}

if (consoleErrors.length) {
  console.log("Console errors:\n" + consoleErrors.map((e) => "  - " + e).join("\n"));
} else {
  console.log("✅ No console errors.");
}

await browser.close();
await sql.end();
