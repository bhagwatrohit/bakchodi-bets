"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { placeBetAction, type BetState } from "@/app/actions/bets";
import { cn } from "@/lib/utils";
import { format } from "@/lib/money";
import type { MatchOutcome } from "@/lib/types";

export function BetForm({
  clanId,
  matchId,
  outcomes,
  maxBet,
  availableBalance,
  currencyName,
}: {
  clanId: string;
  matchId: string;
  outcomes: MatchOutcome[];
  maxBet: string;
  availableBalance: string;
  currencyName: string;
}) {
  const [state, formAction, pending] = useActionState<BetState, FormData>(
    placeBetAction,
    {},
  );
  const [outcomeId, setOutcomeId] = useState<string>(outcomes[0]?.id ?? "");
  const [stake, setStake] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);
  const wasOk = useRef(false);

  useEffect(() => {
    if (state.ok && !wasOk.current) {
      wasOk.current = true;
      toast.success("Bet placed!");
    }
  }, [state.ok]);

  // Lightweight client-side hint only; the server is the source of truth.
  const stakeNum = Number(stake);
  const maxNum = Number(maxBet);
  const balNum = Number(availableBalance);
  let hint: string | null = null;
  if (stake !== "" && Number.isFinite(stakeNum)) {
    if (stakeNum <= 0) hint = "Bet must be greater than zero.";
    else if (stakeNum > maxNum)
      hint = `Max bet is ${format(maxBet, currencyName)}.`;
    else if (stakeNum > balNum)
      hint = `You only have ${format(availableBalance, currencyName)}.`;
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-5 border-2 border-dashed border-ink bg-paper-2 p-4"
    >
      <input type="hidden" name="clanId" value={clanId} />
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="outcomeId" value={outcomeId} />

      <div className="flex flex-col gap-2">
        <Label className="kicker">Your Pick</Label>
        <div className="flex flex-wrap gap-2">
          {outcomes.map((o) => {
            const active = o.id === outcomeId;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setOutcomeId(o.id)}
                aria-pressed={active}
                className={cn(
                  "border-2 px-4 py-2 font-condensed uppercase tracking-widest text-xs font-semibold transition-colors",
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-ink bg-paper hover:bg-muted",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stake" className="kicker">
          Stake
        </Label>
        <Input
          id="stake"
          name="stake"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          placeholder={`How many ${currencyName}?`}
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          required
          className="tabular"
        />
        <p className="dateline">
          Max <span className="tabular">{format(maxBet, currencyName)}</span> · You
          have <span className="tabular">{format(availableBalance, currencyName)}</span>
        </p>
      </div>

      {hint ? (
        <p className="border-l-2 border-danger px-2 py-1 text-xs font-medium text-danger">
          {hint}
        </p>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="border-2 border-danger bg-danger/10 px-3 py-2 text-sm font-medium text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={pending || !outcomeId}
        className="w-full"
      >
        {pending ? "Locking It In…" : "Lock It In"}
      </Button>
    </form>
  );
}
