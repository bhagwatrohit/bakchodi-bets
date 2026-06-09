"use server";

import { revalidatePath } from "next/cache";
import { placeBet } from "@/lib/services/bets";
import { ServiceError } from "@/lib/errors";

export type BetState = { error?: string; ok?: boolean };

export async function placeBetAction(
  _prev: BetState,
  formData: FormData,
): Promise<BetState> {
  const clanId = String(formData.get("clanId") ?? "");
  const matchId = String(formData.get("matchId") ?? "");
  try {
    await placeBet({
      clanId,
      matchId,
      outcomeId: String(formData.get("outcomeId") ?? ""),
      stake: String(formData.get("stake") ?? ""),
    });
  } catch (e) {
    return { error: e instanceof ServiceError ? e.message : "Something went wrong." };
  }
  revalidatePath(`/clans/${clanId}/matches/${matchId}`);
  revalidatePath(`/clans/${clanId}`);
  return { ok: true };
}
