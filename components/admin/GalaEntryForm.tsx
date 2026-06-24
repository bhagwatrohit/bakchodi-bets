"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { setGalaEntryAction, type AdminActionState } from "@/app/actions/admin";

export function GalaEntryForm({
  clanId,
  matchId,
  currentStake,
}: {
  clanId: string;
  matchId: string;
  currentStake: string;
}) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(
    setGalaEntryAction,
    {},
  );
  const wasOk = useRef(false);
  useEffect(() => {
    if (state.ok && !wasOk.current) {
      wasOk.current = true;
      toast.success("Entry stake updated.");
    }
  }, [state.ok]);

  return (
    <form action={action} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <p className="kicker text-[var(--accent-amber)]">Admin · Entry stake</p>
      <input type="hidden" name="clanId" value={clanId} />
      <input type="hidden" name="matchId" value={matchId} />
      <Label htmlFor="fixedStake">Fixed entry stake for every player</Label>
      <div className="flex gap-2">
        <Input
          id="fixedStake"
          name="fixedStake"
          type="number"
          min="1"
          step="any"
          defaultValue={currentStake}
          className="tabular"
        />
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-danger">{state.error}</p>
      ) : (
        <p className="dateline">Applies to new entries; existing entries keep their stake.</p>
      )}
    </form>
  );
}
