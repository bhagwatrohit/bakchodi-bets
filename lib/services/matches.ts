import "server-only";
import { and, eq, gt, asc, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireSessionProfile } from "@/lib/services/auth";
import { requireAdmin, requireMember } from "@/lib/services/clans";
import { notFound, validation } from "@/lib/errors";
import { parseMoney, isPositive } from "@/lib/money";
import type {
  MatchDetail,
  MatchListItem,
  MatchOutcome,
  MatchStage,
  MatchStatus,
  ViewerBet,
} from "@/lib/types";
import type { BetRow, MatchOutcomeRow, MatchRow } from "@/lib/db/schema";

const VALID_STATUS: MatchStatus[] = ["open", "locked", "final", "settled"];

/**
 * Outcome labels for a match. Group games allow a Draw (3 outcomes); knockout
 * games can't end level, so they get just the two teams.
 */
export function buildOutcomeLabels(opts: {
  labelA: string;
  labelB: string;
  stage: MatchStage;
}): string[] {
  return opts.stage === "knockout"
    ? [opts.labelA, opts.labelB]
    : [opts.labelA, "Draw", opts.labelB];
}

async function loadOutcomes(matchId: string): Promise<MatchOutcome[]> {
  const rows = await db
    .select()
    .from(schema.matchOutcomes)
    .where(eq(schema.matchOutcomes.matchId, matchId))
    .orderBy(asc(schema.matchOutcomes.sortOrder));
  return rows.map((r: MatchOutcomeRow) => ({
    id: r.id,
    label: r.label,
    sortOrder: r.sortOrder,
  }));
}

function viewerBet(bet: BetRow | undefined, outcomes: MatchOutcome[]): ViewerBet | null {
  if (!bet) return null;
  const outcome = outcomes.find((o) => o.id === bet.outcomeId);
  return {
    id: bet.id,
    outcomeId: bet.outcomeId,
    outcomeLabel: outcome?.label ?? "—",
    stake: bet.stake,
    status: bet.status as ViewerBet["status"],
    payout: bet.payout,
    profit: bet.profit,
  };
}

export async function createMatch(input: {
  clanId: string;
  title?: string;
  teamA: string;
  teamB: string;
  startsAt: string; // ISO string
  maxBet?: string;
  minBet?: string;
  stage: MatchStage;
  round?: string;
  outcomeALabel?: string;
  outcomeBLabel?: string;
}): Promise<{ matchId: string }> {
  const admin = await requireAdmin(input.clanId);
  const teamA = input.teamA.trim();
  const teamB = input.teamB.trim();
  if (!teamA || !teamB) throw validation("Both teams are required.");

  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) throw validation("Enter a valid start time.");

  const parseOptionalLimit = (raw: string | undefined, label: string): string | null => {
    if (!raw || raw.trim() === "") return null;
    const m = parseMoney(raw);
    if (!m || !isPositive(m)) throw validation(`${label} must be greater than zero.`);
    return m;
  };
  const maxBet = parseOptionalLimit(input.maxBet, "Max bet");
  const minBet = parseOptionalLimit(input.minBet, "Min bet");

  const stage: MatchStage = input.stage === "knockout" ? "knockout" : "group";
  const round = input.round?.trim() || null;
  const title = (input.title?.trim() || `${teamA} vs ${teamB}`).slice(0, 200);
  const labelA = input.outcomeALabel?.trim() || teamA;
  const labelB = input.outcomeBLabel?.trim() || teamB;

  const matchId = await db.transaction(async (tx) => {
    const [match] = await tx
      .insert(schema.matches)
      .values({
        clanId: input.clanId,
        title,
        teamA,
        teamB,
        startsAt,
        maxBet,
        minBet,
        stage,
        round,
        status: "open",
        createdBy: admin.userId,
      })
      .returning({ id: schema.matches.id });

    const outcomeValues = buildOutcomeLabels({ labelA, labelB, stage }).map(
      (label, sortOrder) => ({ matchId: match.id, label, sortOrder }),
    );
    await tx.insert(schema.matchOutcomes).values(outcomeValues);
    return match.id;
  });

  return { matchId };
}

export async function updateMatch(
  matchId: string,
  patch: {
    title?: string;
    teamA?: string;
    teamB?: string;
    startsAt?: string;
    maxBet?: string | null;
    minBet?: string | null;
    fixedStake?: string | null;
  },
): Promise<void> {
  const match = await db.query.matches.findFirst({ where: eq(schema.matches.id, matchId) });
  if (!match) throw notFound("Match not found.");
  await requireAdmin(match.clanId);
  if (match.status === "settled") throw validation("A settled match can't be edited.");

  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.title !== undefined) values.title = patch.title.trim();
  if (patch.teamA !== undefined) values.teamA = patch.teamA.trim();
  if (patch.teamB !== undefined) values.teamB = patch.teamB.trim();
  if (patch.startsAt !== undefined) {
    const d = new Date(patch.startsAt);
    if (Number.isNaN(d.getTime())) throw validation("Enter a valid start time.");
    values.startsAt = d;
  }
  if (patch.maxBet !== undefined) {
    if (patch.maxBet === null || patch.maxBet === "") values.maxBet = null;
    else {
      const m = parseMoney(patch.maxBet);
      if (!m || !isPositive(m)) throw validation("Max bet must be greater than zero.");
      values.maxBet = m;
    }
  }
  if (patch.fixedStake !== undefined) {
    if (patch.fixedStake === null || patch.fixedStake === "") values.fixedStake = null;
    else {
      const m = parseMoney(patch.fixedStake);
      if (!m || !isPositive(m)) throw validation("Entry stake must be greater than zero.");
      values.fixedStake = m;
    }
  }
  if (patch.minBet !== undefined) {
    if (patch.minBet === null || patch.minBet === "") values.minBet = null;
    else {
      const m = parseMoney(patch.minBet);
      if (!m || !isPositive(m)) throw validation("Min bet must be greater than zero.");
      values.minBet = m;
    }
  }

  await db.transaction(async (tx) => {
    await tx.update(schema.matches).set(values).where(eq(schema.matches.id, matchId));

    // Keep the two team outcomes in sync with renamed teams. Critical for the
    // auto-loaded knockout bracket, where matchups start as "TBD" and admins
    // fill in real names once the groups finish. The "Draw" outcome (group
    // games) sits between them by sortOrder and is left untouched.
    if (match.marketType === "match" && (values.teamA != null || values.teamB != null)) {
      const outcomes = await tx
        .select()
        .from(schema.matchOutcomes)
        .where(eq(schema.matchOutcomes.matchId, matchId))
        .orderBy(asc(schema.matchOutcomes.sortOrder));
      if (outcomes.length >= 2) {
        const first = outcomes[0];
        const last = outcomes[outcomes.length - 1];
        if (values.teamA != null) {
          await tx
            .update(schema.matchOutcomes)
            .set({ label: values.teamA as string })
            .where(eq(schema.matchOutcomes.id, first.id));
        }
        if (values.teamB != null) {
          await tx
            .update(schema.matchOutcomes)
            .set({ label: values.teamB as string })
            .where(eq(schema.matchOutcomes.id, last.id));
        }
      }
    }
  });
}

/** Lock / unlock / mark final. Settling is done via settlement.settleMatch. */
export async function setMatchStatus(matchId: string, status: MatchStatus): Promise<void> {
  if (!VALID_STATUS.includes(status)) throw validation("Invalid match status.");
  if (status === "settled") throw validation("Use the settle action to settle a match.");
  const match = await db.query.matches.findFirst({ where: eq(schema.matches.id, matchId) });
  if (!match) throw notFound("Match not found.");
  await requireAdmin(match.clanId);
  if (match.status === "settled") throw validation("This match is already settled.");
  await db
    .update(schema.matches)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.matches.id, matchId));
}

/** A per-match limit override falls back to the clan default when unset. */
function effectiveLimit(matchOverride: string | null, clanDefault: string): string {
  return matchOverride ?? clanDefault;
}

/** Status to display: open match past kickoff in a lock-at-start clan → locked. */
function deriveDisplayStatus(
  status: MatchStatus,
  startsAt: Date,
  clanLockAtStart: boolean,
  now: Date,
): MatchStatus {
  if (status === "open" && clanLockAtStart && now.getTime() >= startsAt.getTime()) {
    return "locked";
  }
  return status;
}

async function buildListItem(
  match: MatchRow,
  clanDefaultMinBet: string,
  clanDefaultMaxBet: string,
  myUserId: string,
  clanLockAtStart: boolean,
): Promise<MatchListItem> {
  const outcomes = await loadOutcomes(match.id);
  const myBetRow = await db.query.bets.findFirst({
    where: and(eq(schema.bets.matchId, match.id), eq(schema.bets.userId, myUserId)),
  });
  const [{ totalPot, betCount }] = await db
    .select({
      totalPot: sql<string>`coalesce(sum(${schema.bets.stake}), 0)::text`,
      betCount: sql<number>`count(*)::int`,
    })
    .from(schema.bets)
    .where(eq(schema.bets.matchId, match.id));

  return {
    id: match.id,
    title: match.title,
    teamA: match.teamA,
    teamB: match.teamB,
    startsAt: match.startsAt,
    status: match.status as MatchStatus,
    displayStatus: deriveDisplayStatus(
      match.status as MatchStatus,
      match.startsAt,
      clanLockAtStart,
      new Date(),
    ),
    marketType: match.marketType as MatchListItem["marketType"],
    stage: match.stage as MatchStage,
    round: match.round,
    groupLabel: match.groupLabel,
    fixedStake: match.fixedStake,
    minBet: effectiveLimit(match.minBet, clanDefaultMinBet),
    maxBet: effectiveLimit(match.maxBet, clanDefaultMaxBet),
    outcomes,
    winningOutcomeId: match.winningOutcomeId,
    myBet: viewerBet(myBetRow, outcomes),
    totalPot,
    betCount,
  };
}

export async function listMatches(clanId: string): Promise<MatchListItem[]> {
  const membership = await requireMember(clanId);
  const clan = await db.query.clans.findFirst({ where: eq(schema.clans.id, clanId) });
  if (!clan) throw notFound("Clan not found.");
  const matchRows = await db
    .select()
    .from(schema.matches)
    .where(eq(schema.matches.clanId, clanId))
    .orderBy(asc(schema.matches.startsAt));
  const items: MatchListItem[] = [];
  for (const m of matchRows) {
    items.push(
      await buildListItem(
        m,
        clan.defaultMinBet,
        clan.defaultMaxBet,
        membership.userId,
        clan.lockBetsAtMatchStart,
      ),
    );
  }
  return items;
}

export async function getMatchDetail(clanId: string, matchId: string): Promise<MatchDetail> {
  const membership = await requireMember(clanId);
  const clan = await db.query.clans.findFirst({ where: eq(schema.clans.id, clanId) });
  if (!clan) throw notFound("Clan not found.");
  const match = await db.query.matches.findFirst({
    where: and(eq(schema.matches.id, matchId), eq(schema.matches.clanId, clanId)),
  });
  if (!match) throw notFound("Match not found.");
  const base = await buildListItem(
    match,
    clan.defaultMinBet,
    clan.defaultMaxBet,
    membership.userId,
    clan.lockBetsAtMatchStart,
  );
  return {
    ...base,
    availableBalance: membership.balance,
    currencyName: clan.currencyName,
    clanLockAtStart: clan.lockBetsAtMatchStart,
  };
}

export interface ClanUpcomingMatch {
  clanId: string;
  matchId: string;
  teamA: string;
  teamB: string;
  startsAt: Date;
}

/**
 * Next kickoff-ordered open team-vs-team matches in every clan the caller
 * belongs to, capped per clan. Powers the dashboard World Cup wire.
 */
export async function upcomingOpenMatchesByClan(
  perClan = 3,
): Promise<Map<string, ClanUpcomingMatch[]>> {
  const me = await requireSessionProfile();
  const rows = await db
    .select({
      clanId: schema.matches.clanId,
      matchId: schema.matches.id,
      teamA: schema.matches.teamA,
      teamB: schema.matches.teamB,
      startsAt: schema.matches.startsAt,
    })
    .from(schema.matches)
    .innerJoin(
      schema.clanMembers,
      and(
        eq(schema.clanMembers.clanId, schema.matches.clanId),
        eq(schema.clanMembers.userId, me.id),
      ),
    )
    .where(
      and(
        eq(schema.matches.status, "open"),
        eq(schema.matches.marketType, "match"),
        gt(schema.matches.startsAt, new Date()),
      ),
    )
    .orderBy(asc(schema.matches.startsAt));

  const grouped = new Map<string, ClanUpcomingMatch[]>();
  for (const row of rows) {
    const list = grouped.get(row.clanId) ?? [];
    if (list.length < perClan) {
      list.push(row);
      grouped.set(row.clanId, list);
    }
  }
  return grouped;
}

/** The clan's Grand Gala (tournament-winner) market, or null if none. */
export async function getGrandGala(clanId: string): Promise<MatchDetail | null> {
  await requireMember(clanId);
  const gala = await db.query.matches.findFirst({
    where: and(
      eq(schema.matches.clanId, clanId),
      eq(schema.matches.marketType, "tournament_winner"),
    ),
  });
  if (!gala) return null;
  return getMatchDetail(clanId, gala.id);
}
