import "server-only";
import { and, eq, sql, desc } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { db, schema } from "@/lib/db";
import { requireSessionProfile } from "@/lib/services/auth";
import { conflict, forbidden, notFound, validation } from "@/lib/errors";
import { parseMoney, isPositive, gte, add } from "@/lib/money";
import type { Clan, ClanCardData, ClanMember, ClanRole, ClanSettings } from "@/lib/types";
import type { ClanRow, ClanMemberRow } from "@/lib/db/schema";
import {
  WORLD_CUP_FIXTURES,
  fixtureStartsAt,
  WORLD_CUP_TEAMS,
  GRAND_GALA_TITLE,
  grandGalaLockAt,
} from "@/lib/worldCupFixtures";

// Readable invite codes (no ambiguous chars).
const makeInviteCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

function mapClan(row: ClanRow): Clan {
  return {
    id: row.id,
    name: row.name,
    createdBy: row.createdBy ?? "",
    currencyName: row.currencyName,
    startingBalance: row.startingBalance,
    defaultMaxBet: row.defaultMaxBet,
    lockBetsAtMatchStart: row.lockBetsAtMatchStart,
    showBetsBeforeLock: row.showBetsBeforeLock,
    showBetsAfterLock: row.showBetsAfterLock,
    inviteCode: row.inviteCode,
    isGlobalPool: row.isGlobalPool,
    createdAt: row.createdAt,
  };
}

function mapMember(row: ClanMemberRow): ClanMember {
  return {
    id: row.id,
    clanId: row.clanId,
    userId: row.userId,
    role: row.role as ClanRole,
    balance: row.balance,
    joinedAt: row.joinedAt,
  };
}

/** Compute a member's rank (1 = highest balance) within their clan. */
async function rankOf(clanId: string, userId: string): Promise<number> {
  const rows = await db
    .select({ userId: schema.clanMembers.userId, balance: schema.clanMembers.balance })
    .from(schema.clanMembers)
    .where(eq(schema.clanMembers.clanId, clanId))
    .orderBy(desc(sql`${schema.clanMembers.balance}::numeric`));
  const idx = rows.findIndex((r) => r.userId === userId);
  return idx < 0 ? rows.length : idx + 1;
}

export async function createClan(input: {
  name: string;
  currencyName: string;
  startingBalance: string;
  defaultMaxBet: string;
  lockBetsAtMatchStart?: boolean;
  showBetsBeforeLock?: boolean;
  showBetsAfterLock?: boolean;
  seedWorldCup?: boolean; // pre-load the 2026 World Cup fixtures (default true)
}): Promise<{ clanId: string }> {
  const me = await requireSessionProfile();

  const name = input.name.trim();
  const currencyName = input.currencyName.trim() || "credits";
  const startingBalance = parseMoney(input.startingBalance);
  const defaultMaxBet = parseMoney(input.defaultMaxBet);

  if (name.length < 2) throw validation("Clan name is too short.");
  if (!startingBalance || !isPositive(startingBalance))
    throw validation("Starting balance must be greater than zero.");
  if (!defaultMaxBet || !isPositive(defaultMaxBet))
    throw validation("Default max bet must be greater than zero.");

  const clanId = await db.transaction(async (tx) => {
    const [clan] = await tx
      .insert(schema.clans)
      .values({
        name,
        createdBy: me.id,
        currencyName,
        startingBalance,
        defaultMaxBet,
        lockBetsAtMatchStart: input.lockBetsAtMatchStart ?? true,
        showBetsBeforeLock: input.showBetsBeforeLock ?? false,
        showBetsAfterLock: input.showBetsAfterLock ?? true,
        inviteCode: makeInviteCode(),
      })
      .returning();

    await tx.insert(schema.clanMembers).values({
      clanId: clan.id,
      userId: me.id,
      role: "admin",
      balance: startingBalance,
    });

    await tx.insert(schema.ledgerEntries).values({
      clanId: clan.id,
      userId: me.id,
      transactionType: "initial_balance",
      amount: startingBalance,
      balanceAfter: startingBalance,
      reason: "Clan created",
      createdBy: me.id,
    });

    // Pre-load the 2026 World Cup fixtures so the clan isn't empty.
    if (input.seedWorldCup ?? true) {
      const matchRows = await tx
        .insert(schema.matches)
        .values(
          WORLD_CUP_FIXTURES.map((f) => ({
            clanId: clan.id,
            title: `${f.team_a} vs ${f.team_b}`,
            teamA: f.team_a,
            teamB: f.team_b,
            startsAt: fixtureStartsAt(f),
            status: "open" as const,
            createdBy: me.id,
          })),
        )
        .returning({ id: schema.matches.id });

      // Postgres preserves VALUES order in RETURNING, so rows align with fixtures.
      const outcomeValues = matchRows.flatMap((row, i) => {
        const f = WORLD_CUP_FIXTURES[i];
        return [
          { matchId: row.id, label: f.team_a, sortOrder: 0 },
          { matchId: row.id, label: "Draw", sortOrder: 1 },
          { matchId: row.id, label: f.team_b, sortOrder: 2 },
        ];
      });
      await tx.insert(schema.matchOutcomes).values(outcomeValues);

      // Grand Gala: pick the World Cup champion. Fixed entry stake (default =
      // clan max bet, admin-editable), open until the knockouts begin.
      const [gala] = await tx
        .insert(schema.matches)
        .values({
          clanId: clan.id,
          title: GRAND_GALA_TITLE,
          teamA: "World Cup",
          teamB: "Champion",
          startsAt: grandGalaLockAt(),
          status: "open" as const,
          marketType: "tournament_winner" as const,
          fixedStake: defaultMaxBet,
          createdBy: me.id,
        })
        .returning({ id: schema.matches.id });
      await tx.insert(schema.matchOutcomes).values(
        WORLD_CUP_TEAMS.map((team, i) => ({
          matchId: gala.id,
          label: team,
          sortOrder: i,
        })),
      );
    }

    return clan.id;
  });

  return { clanId };
}

export async function getClanForInvite(inviteCode: string): Promise<{
  id: string;
  name: string;
  currencyName: string;
  startingBalance: string;
  memberCount: number;
} | null> {
  const clan = await db.query.clans.findFirst({
    where: eq(schema.clans.inviteCode, inviteCode),
  });
  if (!clan) return null;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.clanMembers)
    .where(eq(schema.clanMembers.clanId, clan.id));
  return {
    id: clan.id,
    name: clan.name,
    currencyName: clan.currencyName,
    startingBalance: clan.startingBalance,
    memberCount: count,
  };
}

export async function joinClan(input: { inviteCode: string }): Promise<{ clanId: string }> {
  const me = await requireSessionProfile();
  const clan = await db.query.clans.findFirst({
    where: eq(schema.clans.inviteCode, input.inviteCode.trim()),
  });
  if (!clan) throw notFound("That invite code isn't valid.");

  const existing = await db.query.clanMembers.findFirst({
    where: and(
      eq(schema.clanMembers.clanId, clan.id),
      eq(schema.clanMembers.userId, me.id),
    ),
  });
  if (existing) throw conflict("You're already a member of this clan.");

  await db.transaction(async (tx) => {
    await tx.insert(schema.clanMembers).values({
      clanId: clan.id,
      userId: me.id,
      role: "member",
      balance: clan.startingBalance,
    });
    await tx.insert(schema.ledgerEntries).values({
      clanId: clan.id,
      userId: me.id,
      transactionType: "initial_balance",
      amount: clan.startingBalance,
      balanceAfter: clan.startingBalance,
      reason: "Joined clan",
      createdBy: me.id,
    });
  });

  return { clanId: clan.id };
}

/** Clans the current user belongs to, as dashboard cards. */
export async function listMyClans(): Promise<ClanCardData[]> {
  const me = await requireSessionProfile();
  const memberships = await db
    .select({ clan: schema.clans, member: schema.clanMembers })
    .from(schema.clanMembers)
    .innerJoin(schema.clans, eq(schema.clanMembers.clanId, schema.clans.id))
    .where(eq(schema.clanMembers.userId, me.id))
    .orderBy(desc(schema.clanMembers.joinedAt));

  const cards: ClanCardData[] = [];
  for (const { clan, member } of memberships) {
    const [{ memberCount }] = await db
      .select({ memberCount: sql<number>`count(*)::int` })
      .from(schema.clanMembers)
      .where(eq(schema.clanMembers.clanId, clan.id));
    const [{ openMatchCount }] = await db
      .select({ openMatchCount: sql<number>`count(*)::int` })
      .from(schema.matches)
      .where(and(eq(schema.matches.clanId, clan.id), eq(schema.matches.status, "open")));
    cards.push({
      clanId: clan.id,
      name: clan.name,
      currencyName: clan.currencyName,
      balance: member.balance,
      rank: await rankOf(clan.id, me.id),
      memberCount,
      openMatchCount,
      role: member.role as ClanRole,
    });
  }
  return cards;
}

/** Clan + caller's membership, or null if the caller isn't a member. */
export async function getClanContext(
  clanId: string,
): Promise<{ clan: Clan; membership: ClanMember } | null> {
  const me = await requireSessionProfile();
  const clan = await db.query.clans.findFirst({ where: eq(schema.clans.id, clanId) });
  if (!clan) return null;
  const member = await db.query.clanMembers.findFirst({
    where: and(eq(schema.clanMembers.clanId, clanId), eq(schema.clanMembers.userId, me.id)),
  });
  if (!member) return null;
  return { clan: mapClan(clan), membership: mapMember(member) };
}

/** Throw unless the caller is a member of the clan; returns the membership. */
export async function requireMember(clanId: string): Promise<ClanMember> {
  const ctx = await getClanContext(clanId);
  if (!ctx) throw forbidden("You're not a member of this clan.");
  return ctx.membership;
}

/** Throw unless the caller is an admin of the clan; returns the membership. */
export async function requireAdmin(clanId: string): Promise<ClanMember> {
  const membership = await requireMember(clanId);
  if (membership.role !== "admin") throw forbidden("Only clan admins can do that.");
  return membership;
}

/** Members of a clan (for admin management): id, name, role, balance, isMe. */
export async function listMembers(clanId: string): Promise<
  { userId: string; displayName: string; role: ClanRole; balance: string; isMe: boolean }[]
> {
  const me = await requireMember(clanId);
  const rows = await db
    .select({ member: schema.clanMembers, profile: schema.profiles })
    .from(schema.clanMembers)
    .innerJoin(schema.profiles, eq(schema.clanMembers.userId, schema.profiles.id))
    .where(eq(schema.clanMembers.clanId, clanId))
    .orderBy(desc(schema.clanMembers.role), schema.profiles.displayName);
  return rows.map(({ member, profile }) => ({
    userId: member.userId,
    displayName: profile.displayName,
    role: member.role as ClanRole,
    balance: member.balance,
    isMe: member.userId === me.userId,
  }));
}

/** Admin removes a member from the clan, deleting their bets + ledger for it. */
export async function removeMember(clanId: string, targetUserId: string): Promise<void> {
  const admin = await requireAdmin(clanId);
  if (targetUserId === admin.userId) throw validation("You can't remove yourself.");

  const target = await db.query.clanMembers.findFirst({
    where: and(
      eq(schema.clanMembers.clanId, clanId),
      eq(schema.clanMembers.userId, targetUserId),
    ),
  });
  if (!target) throw notFound("That member isn't in this clan.");
  if (target.role === "admin") throw forbidden("You can't remove another admin.");

  await db.transaction(async (tx) => {
    await tx
      .delete(schema.bets)
      .where(and(eq(schema.bets.clanId, clanId), eq(schema.bets.userId, targetUserId)));
    await tx
      .delete(schema.ledgerEntries)
      .where(
        and(
          eq(schema.ledgerEntries.clanId, clanId),
          eq(schema.ledgerEntries.userId, targetUserId),
        ),
      );
    await tx.delete(schema.clanMembers).where(eq(schema.clanMembers.id, target.id));
  });
}

export async function updateClanSettings(
  clanId: string,
  patch: Partial<ClanSettings>,
): Promise<void> {
  await requireAdmin(clanId);
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (name.length < 2) throw validation("Clan name is too short.");
    values.name = name;
  }
  if (patch.currencyName !== undefined)
    values.currencyName = patch.currencyName.trim() || "credits";
  if (patch.defaultMaxBet !== undefined) {
    const m = parseMoney(patch.defaultMaxBet);
    if (!m || !isPositive(m)) throw validation("Default max bet must be greater than zero.");
    values.defaultMaxBet = m;
  }
  if (patch.lockBetsAtMatchStart !== undefined)
    values.lockBetsAtMatchStart = patch.lockBetsAtMatchStart;
  if (patch.showBetsBeforeLock !== undefined)
    values.showBetsBeforeLock = patch.showBetsBeforeLock;
  if (patch.showBetsAfterLock !== undefined)
    values.showBetsAfterLock = patch.showBetsAfterLock;

  await db.update(schema.clans).set(values).where(eq(schema.clans.id, clanId));
}

/** Admin manual balance adjustment (positive or negative) with an audit reason. */
export async function adjustBalance(
  clanId: string,
  targetUserId: string,
  amount: string,
  reason: string,
): Promise<void> {
  const admin = await requireAdmin(clanId);
  const delta = parseMoney(amount);
  if (!delta) throw validation("Enter a valid amount.");
  if (!reason.trim()) throw validation("A reason is required for manual adjustments.");

  await db.transaction(async (tx) => {
    const member = await tx.query.clanMembers.findFirst({
      where: and(
        eq(schema.clanMembers.clanId, clanId),
        eq(schema.clanMembers.userId, targetUserId),
      ),
    });
    if (!member) throw notFound("That member isn't in this clan.");
    const newBalance = add(member.balance, delta);
    if (!gte(newBalance, "0")) throw validation("Adjustment would make the balance negative.");
    await tx
      .update(schema.clanMembers)
      .set({ balance: newBalance })
      .where(eq(schema.clanMembers.id, member.id));
    await tx.insert(schema.ledgerEntries).values({
      clanId,
      userId: targetUserId,
      transactionType: "admin_adjustment",
      amount: delta,
      balanceAfter: newBalance,
      reason: reason.trim(),
      createdBy: admin.userId,
    });
  });
}
