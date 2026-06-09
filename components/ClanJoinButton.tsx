"use client";

import { useActionState } from "react";
import { joinClanAction, type ClanFormState } from "@/app/actions/clans";
import { Button } from "@/components/ui/button";

const initial: ClanFormState = {};

/** "Join clan" form — submits the invite code to the join Server Action. */
export function ClanJoinButton({ inviteCode }: { inviteCode: string }) {
  const [state, formAction, pending] = useActionState(joinClanAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="inviteCode" value={inviteCode} />
      {state.error ? (
        <p className="border-2 border-danger bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          <span className="stamp text-neon-pink mr-2">Game Over</span>
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Loading…" : "Join Clan"}
      </Button>
    </form>
  );
}
