"use server";

import { redirect } from "next/navigation";
import { createClan, joinClan } from "@/lib/services/clans";
import { ServiceError } from "@/lib/errors";

export type ClanFormState = { error?: string };

/** Create a clan from the "new clan" form, then drop the user into its home. */
export async function createClanAction(
  _prev: ClanFormState,
  fd: FormData,
): Promise<ClanFormState> {
  let clanId: string;
  try {
    ({ clanId } = await createClan({
      name: String(fd.get("name") ?? ""),
      currencyName: String(fd.get("currencyName") ?? ""),
      startingBalance: String(fd.get("startingBalance") ?? ""),
      defaultMaxBet: String(fd.get("defaultMaxBet") ?? ""),
      lockBetsAtMatchStart: fd.get("lockBetsAtMatchStart") === "on",
      showBetsBeforeLock: fd.get("showBetsBeforeLock") === "on",
      showBetsAfterLock: fd.get("showBetsAfterLock") === "on",
      seedWorldCup: fd.get("seedWorldCup") === "on",
    }));
  } catch (e) {
    return { error: e instanceof ServiceError ? e.message : "Something went wrong." };
  }
  redirect(`/clans/${clanId}`);
}

/** Join a clan via its invite code, then drop the user into its home. */
export async function joinClanAction(
  _prev: ClanFormState,
  fd: FormData,
): Promise<ClanFormState> {
  let clanId: string;
  try {
    ({ clanId } = await joinClan({ inviteCode: String(fd.get("inviteCode") ?? "") }));
  } catch (e) {
    return { error: e instanceof ServiceError ? e.message : "Something went wrong." };
  }
  redirect(`/clans/${clanId}`);
}
