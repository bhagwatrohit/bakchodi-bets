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
        className="rounded-md border border-danger px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-danger-foreground disabled:opacity-40"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
    </form>
  );
}
