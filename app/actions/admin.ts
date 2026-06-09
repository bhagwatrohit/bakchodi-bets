"use server";

import { revalidatePath } from "next/cache";
import { updateClanSettings, adjustBalance } from "@/lib/services/clans";
import { createMatch, updateMatch, setMatchStatus } from "@/lib/services/matches";
import { settleMatch, voidMatch } from "@/lib/services/settlement";
import { ServiceError } from "@/lib/errors";

export type AdminActionState = { error?: string; ok?: boolean };

const fail = (e: unknown): AdminActionState => ({
  error: e instanceof ServiceError ? e.message : "Something went wrong.",
});

function revalidateClan(clanId: string) {
  revalidatePath(`/clans/${clanId}/admin`);
  revalidatePath(`/clans/${clanId}`);
}

/** Update clan-level settings (name, currency, max bet, visibility toggles). */
export async function updateClanSettingsAction(
  _prev: AdminActionState,
  fd: FormData,
): Promise<AdminActionState> {
  const clanId = String(fd.get("clanId") ?? "");
  try {
    await updateClanSettings(clanId, {
      name: String(fd.get("name") ?? ""),
      currencyName: String(fd.get("currencyName") ?? ""),
      defaultMaxBet: String(fd.get("defaultMaxBet") ?? ""),
      lockBetsAtMatchStart: fd.get("lockBetsAtMatchStart") === "on",
      showBetsBeforeLock: fd.get("showBetsBeforeLock") === "on",
      showBetsAfterLock: fd.get("showBetsAfterLock") === "on",
    });
  } catch (e) {
    return fail(e);
  }
  revalidateClan(clanId);
  return { ok: true };
}

/** Create a new match with two (or three, w/ draw) outcomes. */
export async function createMatchAction(
  _prev: AdminActionState,
  fd: FormData,
): Promise<AdminActionState> {
  const clanId = String(fd.get("clanId") ?? "");
  try {
    await createMatch({
      clanId,
      title: String(fd.get("title") ?? "") || undefined,
      teamA: String(fd.get("teamA") ?? ""),
      teamB: String(fd.get("teamB") ?? ""),
      startsAt: String(fd.get("startsAt") ?? ""),
      maxBet: String(fd.get("maxBet") ?? "") || undefined,
      includeDraw: fd.get("includeDraw") === "on",
      outcomeALabel: String(fd.get("outcomeALabel") ?? "") || undefined,
      outcomeBLabel: String(fd.get("outcomeBLabel") ?? "") || undefined,
    });
  } catch (e) {
    return fail(e);
  }
  revalidateClan(clanId);
  return { ok: true };
}

/** Edit an existing match's details. */
export async function updateMatchAction(
  _prev: AdminActionState,
  fd: FormData,
): Promise<AdminActionState> {
  const clanId = String(fd.get("clanId") ?? "");
  const matchId = String(fd.get("matchId") ?? "");
  try {
    await updateMatch(matchId, {
      title: String(fd.get("title") ?? ""),
      teamA: String(fd.get("teamA") ?? ""),
      teamB: String(fd.get("teamB") ?? ""),
      startsAt: String(fd.get("startsAt") ?? ""),
      maxBet: (String(fd.get("maxBet") ?? "") || null) as string | null,
    });
  } catch (e) {
    return fail(e);
  }
  revalidateClan(clanId);
  return { ok: true };
}

/** Lock betting on a match. */
export async function lockMatchAction(
  _prev: AdminActionState,
  fd: FormData,
): Promise<AdminActionState> {
  const clanId = String(fd.get("clanId") ?? "");
  const matchId = String(fd.get("matchId") ?? "");
  try {
    await setMatchStatus(matchId, "locked");
  } catch (e) {
    return fail(e);
  }
  revalidateClan(clanId);
  return { ok: true };
}

/** Re-open betting on a match. */
export async function unlockMatchAction(
  _prev: AdminActionState,
  fd: FormData,
): Promise<AdminActionState> {
  const clanId = String(fd.get("clanId") ?? "");
  const matchId = String(fd.get("matchId") ?? "");
  try {
    await setMatchStatus(matchId, "open");
  } catch (e) {
    return fail(e);
  }
  revalidateClan(clanId);
  return { ok: true };
}

/** Settle a match: pick the winning outcome, pay out winners. */
export async function settleMatchAction(
  _prev: AdminActionState,
  fd: FormData,
): Promise<AdminActionState> {
  const clanId = String(fd.get("clanId") ?? "");
  const matchId = String(fd.get("matchId") ?? "");
  const winningOutcomeId = String(fd.get("winningOutcomeId") ?? "");
  if (!winningOutcomeId) return { error: "Pick the winning outcome first." };
  try {
    await settleMatch({ matchId, winningOutcomeId });
  } catch (e) {
    return fail(e);
  }
  revalidateClan(clanId);
  return { ok: true };
}

/** Void a match: refund every pending bet, burn nothing. */
export async function voidMatchAction(
  _prev: AdminActionState,
  fd: FormData,
): Promise<AdminActionState> {
  const clanId = String(fd.get("clanId") ?? "");
  const matchId = String(fd.get("matchId") ?? "");
  try {
    await voidMatch({ matchId });
  } catch (e) {
    return fail(e);
  }
  revalidateClan(clanId);
  return { ok: true };
}

/** Manually nudge a member's balance up or down, with an audit reason. */
export async function adjustBalanceAction(
  _prev: AdminActionState,
  fd: FormData,
): Promise<AdminActionState> {
  const clanId = String(fd.get("clanId") ?? "");
  try {
    await adjustBalance(
      clanId,
      String(fd.get("targetUserId") ?? ""),
      String(fd.get("amount") ?? ""),
      String(fd.get("reason") ?? ""),
    );
  } catch (e) {
    return fail(e);
  }
  revalidateClan(clanId);
  return { ok: true };
}
