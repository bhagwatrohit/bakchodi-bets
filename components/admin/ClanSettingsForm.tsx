"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { updateClanSettingsAction, type AdminActionState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Clan } from "@/lib/types";

const initial: AdminActionState = {};

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
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

export function ClanSettingsForm({ clan }: { clan: Clan }) {
  const [state, formAction, pending] = useActionState(updateClanSettingsAction, initial);
  const lastOk = useRef(false);

  useEffect(() => {
    if (state.ok && !lastOk.current) toast.success("House rules updated.");
    lastOk.current = !!state.ok;
  }, [state.ok]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="clanId" value={clan.id} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-name">Clan name</Label>
        <Input id="settings-name" name="name" required minLength={2} defaultValue={clan.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-currency">Currency name</Label>
          <Input
            id="settings-currency"
            name="currencyName"
            defaultValue={clan.currencyName}
            placeholder="credits"
          />
          <p className="text-xs text-muted-foreground">Fictional credits only — no cash value.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-maxbet">Default max bet</Label>
          <Input
            id="settings-maxbet"
            name="defaultMaxBet"
            type="number"
            min="1"
            step="any"
            defaultValue={clan.defaultMaxBet}
            required
          />
          <p className="text-xs text-muted-foreground">Per-match cap unless a match overrides it.</p>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">Visibility &amp; locks</legend>
        <Toggle
          name="lockBetsAtMatchStart"
          label="Lock bets at kickoff"
          hint="No sneaky bets once the match starts."
          defaultChecked={clan.lockBetsAtMatchStart}
        />
        <Toggle
          name="showBetsBeforeLock"
          label="Show everyone's picks before lock"
          hint="Off keeps picks secret until kickoff."
          defaultChecked={clan.showBetsBeforeLock}
        />
        <Toggle
          name="showBetsAfterLock"
          label="Reveal picks after lock"
          hint="Let the trash talk begin once betting closes."
          defaultChecked={clan.showBetsAfterLock}
        />
      </fieldset>

      {state.error ? (
        <p className="rounded-md bg-danger/15 px-3 py-2 text-sm text-danger">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save house rules"}
      </Button>
    </form>
  );
}
