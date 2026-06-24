"use client";

import { useActionState } from "react";
import { createClanAction, type ClanFormState } from "@/app/actions/clans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ClanFormState = {};

function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-background p-3 transition-colors hover:bg-muted">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

export function ClanCreateForm() {
  const [state, formAction, pending] = useActionState(createClanAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <p className="kicker">Clan Name</p>
        <Label htmlFor="name">Clan name</Label>
        <Input
          id="name"
          name="name"
          required
          minLength={2}
          placeholder="The Group Chat Degenerates"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="kicker">Currency</p>
        <Label htmlFor="currencyName">What do you call your funny money?</Label>
        <Input id="currencyName" name="currencyName" defaultValue="credits" placeholder="credits" />
        <p className="text-xs text-muted-foreground">
          Fictional credits only — no cash value. Name them whatever you like.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="kicker">Starting Credits</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startingBalance">Starting balance</Label>
            <Input
              id="startingBalance"
              name="startingBalance"
              type="number"
              min="1"
              step="any"
              defaultValue="1000"
              required
              className="tabular"
            />
            <p className="text-xs text-muted-foreground">Everyone starts here.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="defaultMinBet">Default min bet</Label>
            <Input
              id="defaultMinBet"
              name="defaultMinBet"
              type="number"
              min="1"
              step="any"
              defaultValue="100"
              required
              className="tabular"
            />
            <p className="text-xs text-muted-foreground">Per-match floor (you can override later).</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="defaultMaxBet">Default max bet</Label>
            <Input
              id="defaultMaxBet"
              name="defaultMaxBet"
              type="number"
              min="1"
              step="any"
              defaultValue="500"
              required
              className="tabular"
            />
            <p className="text-xs text-muted-foreground">Per-match cap (you can override later).</p>
          </div>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="kicker mb-1">Game Settings</legend>
        <Toggle
          name="seedWorldCup"
          label="Load the 2026 World Cup fixtures"
          hint="Pre-fill all 72 group-stage matches so you can bet right away."
          defaultChecked
        />
        <Toggle
          name="lockBetsAtMatchStart"
          label="Lock bets at kickoff"
          hint="No sneaky bets once the match starts."
          defaultChecked
        />
        <Toggle
          name="showBetsBeforeLock"
          label="Show everyone's picks before lock"
          hint="Off by default — keep your picks secret until kickoff."
        />
        <Toggle
          name="showBetsAfterLock"
          label="Reveal picks after lock"
          hint="Let the trash talk begin once betting closes."
          defaultChecked
        />
      </fieldset>

      {state.error ? (
        <p className="rounded-md border border-danger bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creating…" : "Create clan"}
      </Button>
    </form>
  );
}
