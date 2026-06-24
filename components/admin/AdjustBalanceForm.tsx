"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { adjustBalanceAction, type AdminActionState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AdminActionState = {};

export interface AdjustBalanceMember {
  userId: string;
  displayName: string;
}

export function AdjustBalanceForm({
  clanId,
  members,
  currencyName,
}: {
  clanId: string;
  members: AdjustBalanceMember[];
  currencyName: string;
}) {
  const [state, formAction, pending] = useActionState(adjustBalanceAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const lastOk = useRef(false);

  useEffect(() => {
    if (state.ok && !lastOk.current) {
      toast.success("Balance adjusted — it's on the ledger.");
      formRef.current?.reset();
    }
    lastOk.current = !!state.ok;
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="clanId" value={clanId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="adjust-member">Member</Label>
        <select
          id="adjust-member"
          name="targetUserId"
          required
          className="flex h-11 w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Pick a member…</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="adjust-amount">Amount ({currencyName})</Label>
        <Input
          id="adjust-amount"
          name="amount"
          type="number"
          step="any"
          required
          placeholder="e.g. 50 to credit, -50 to debit"
          className="tabular"
        />
        <p className="text-xs text-muted-foreground">
          Positive credits, negative debits. Can&apos;t push a balance below zero.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="adjust-reason">Reason</Label>
        <Input id="adjust-reason" name="reason" required placeholder="e.g. Manual correction, side bet payout" />
      </div>

      {state.error ? (
        <p className="stamp w-fit text-danger">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Adjusting…" : "Adjust balance"}
      </Button>
    </form>
  );
}
