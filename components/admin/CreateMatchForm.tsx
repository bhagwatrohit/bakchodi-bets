"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createMatchAction, type AdminActionState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AdminActionState = {};

export function CreateMatchForm({ clanId }: { clanId: string }) {
  const [state, formAction, pending] = useActionState(createMatchAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const lastOk = useRef(false);

  useEffect(() => {
    if (state.ok && !lastOk.current) {
      toast.success("Match added — go place your bets.");
      formRef.current?.reset();
    }
    lastOk.current = !!state.ok;
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="clanId" value={clanId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match-teamA">Team A</Label>
          <Input id="match-teamA" name="teamA" required placeholder="India" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match-teamB">Team B</Label>
          <Input id="match-teamB" name="teamB" required placeholder="Pakistan" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="match-title">Title (optional)</Label>
        <Input id="match-title" name="title" placeholder="Defaults to “Team A vs Team B”" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match-startsAt">Kickoff</Label>
          <Input id="match-startsAt" name="startsAt" type="datetime-local" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match-maxBet">Max bet (optional)</Label>
          <Input
            id="match-maxBet"
            name="maxBet"
            type="number"
            min="1"
            step="any"
            placeholder="Clan default"
            className="tabular"
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 border border-grid p-3 transition-colors hover:bg-muted">
        <input
          type="checkbox"
          name="includeDraw"
          className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
        />
        <span className="flex flex-col gap-0.5">
          <span className="font-condensed text-sm font-semibold uppercase tracking-wide">Allow a draw</span>
          <span className="text-xs text-muted-foreground">Adds a third “Draw” outcome.</span>
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match-outcomeALabel">Outcome A label (optional)</Label>
          <Input id="match-outcomeALabel" name="outcomeALabel" placeholder="Defaults to Team A" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match-outcomeBLabel">Outcome B label (optional)</Label>
          <Input id="match-outcomeBLabel" name="outcomeBLabel" placeholder="Defaults to Team B" />
        </div>
      </div>

      {state.error ? (
        <p className="stamp w-fit text-danger">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "ADD MATCH"}
      </Button>
    </form>
  );
}
