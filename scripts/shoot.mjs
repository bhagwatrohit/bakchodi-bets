// Screenshot the key pages to eyeball the newsprint theme.
import { chromium } from "playwright";
import { SignJWT } from "jose";
import postgres from "postgres";
import { config } from "dotenv";
import { mkdirSync } from "node:fs";

config({ path: ".env.local", quiet: true });
const BASE = "http://localhost:3000";
const OUT = "/tmp/bb-shots";
mkdirSync(OUT, { recursive: true });

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const [rohit] = await sql`select id from profiles where display_name = 'Rohit'`;
const [clan] = await sql`select id from clans where invite_code = 'WORLDCUP'`;
const [match] = await sql`select id from matches where clan_id=${clan.id} and status='open' order by starts_at limit 1`;
await sql.end();

const token = await new SignJWT({ sub: rohit.id })
  .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("604800s")
  .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

const W = Number(process.env.SHOT_W || 1280);
const H = Number(process.env.SHOT_H || 1400);
const OUTDIR = process.env.SHOT_DIR || OUT;
mkdirSync(OUTDIR, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await ctx.addCookies([{ name: "bb_session", value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
if (process.env.SHOT_THEME === "light") {
  await ctx.addInitScript(() => {
    try { localStorage.setItem("bb-theme", "light"); } catch {}
  });
}
const page = await ctx.newPage();

const shots = [
  ["landing", `${BASE}/`],
  ["login", `${BASE}/login`],
  ["dashboard", `${BASE}/dashboard`],
  ["clan-home", `${BASE}/clans/${clan.id}`],
  ["matches", `${BASE}/clans/${clan.id}/matches`],
  ["match-detail", `${BASE}/clans/${clan.id}/matches/${match.id}`],
  ["leaderboard", `${BASE}/clans/${clan.id}/leaderboard`],
  ["admin", `${BASE}/clans/${clan.id}/admin`],
];
for (const [name, url] of shots) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUTDIR}/${name}.png`, fullPage: true });
  console.log(`shot: ${name}`);
}
await browser.close();
console.log("done ->", OUT);
