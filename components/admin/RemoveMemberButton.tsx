"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { removeMemberAction, type AdminActionState } from "@/app/actions/admin";

export function RemoveMemberButton({
  clanId,
  userId,
  displayName,
}: {
  clanId: string;
  userId: string;
  displayName: string;
}) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(
    removeMemberAction,
    {},
  );
  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) toast.success(`${displayName} removed.`);
  }, [state, displayName]);

  return (
    <form action={action}>
      <input type="hidden" name="clanId" value={clanId} />
      <input type="hidden" name="targetUserId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="border-2 border-neon-pink px-3 py-1 font-pixel text-[0.55rem] uppercase tracking-wide text-neon-pink transition-colors hover:bg-neon-pink hover:text-background disabled:opacity-40"
      >
        {pending ? "…" : "Remove"}
      </button>
    </form>
  );
}
