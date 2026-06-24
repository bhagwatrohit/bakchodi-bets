"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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

  const [stage, setStage] = useState<"group" | "knockout">("group");
  // datetime-local gives a zone-less wall-clock string. Convert it to a real
  // instant in the admin's OWN timezone so the match locks at true kickoff
  // regardless of where the server runs.
  const [localKickoff, setLocalKickoff] = useState("");
  const startsAtIso = localKickoff ? new Date(localKickoff).toISOString() : "";

  useEffect(() => {
    if (state.ok && !lastOk.current) {
      toast.success("Match added — go place your bets.");
      formRef.current?.reset();
      setStage("group");
      setLocalKickoff("");
    }
    lastOk.current = !!state.ok;
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="clanId" value={clanId} />
      <input type="hidden" name="stage" value={stage} />
      <input type="hidden" name="startsAt" value={startsAtIso} />

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

      {/* Match type — group games allow a Draw; knockouts can't end level. */}
      <div className="flex flex-col gap-1.5">
        <Label>Match type</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["group", "knockout"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStage(s)}
              aria-pressed={stage === s}
              className={`rounded-md border px-3 py-2 text-sm font-semibold capitalize transition-colors ${
                stage === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {s === "group" ? "Group (allows Draw)" : "Knockout (no Draw)"}
            </button>
          ))}
        </div>
      </div>

      {stage === "knockout" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match-round">Round (optional)</Label>
          <Input id="match-round" name="round" placeholder="e.g. Round of 16" />
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="match-startsAt">Kickoff</Label>
        <Input
          id="match-startsAt"
          type="datetime-local"
          required
          value={localKickoff}
          onChange={(e) => setLocalKickoff(e.target.value)}
        />
        <p className="dateline">Uses your device’s timezone.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match-minBet">Min bet (optional)</Label>
          <Input
            id="match-minBet"
            name="minBet"
            type="number"
            min="1"
            step="any"
            placeholder="Clan default"
            className="tabular"
          />
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

      {state.error ? <p className="stamp w-fit text-danger">{state.error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add match"}
      </Button>
    </form>
  );
}
