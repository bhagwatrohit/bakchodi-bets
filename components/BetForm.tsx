"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flag } from "@/components/Flag";
import { placeBetAction, type BetState } from "@/app/actions/bets";
import { cn } from "@/lib/utils";
import { format } from "@/lib/money";
import type { MarketType, MatchOutcome } from "@/lib/types";

export function BetForm({
  clanId,
  matchId,
  outcomes,
  minBet,
  maxBet,
  availableBalance,
  currencyName,
  marketType = "match",
  fixedStake = null,
  existingBet = null,
}: {
  clanId: string;
  matchId: string;
  outcomes: MatchOutcome[];
  minBet: string;
  maxBet: string;
  availableBalance: string;
  currencyName: string;
  marketType?: MarketType;
  fixedStake?: string | null;
  existingBet?: { outcomeId: string; stake: string } | null;
}) {
  const [state, formAction, pending] = useActionState<BetState, FormData>(
    placeBetAction,
    {},
  );
  const editing = existingBet != null;
  const [outcomeId, setOutcomeId] = useState<string>(
    existingBet?.outcomeId ?? outcomes[0]?.id ?? "",
  );
  const [stake, setStake] = useState<string>(existingBet?.stake ?? "");
  const [filter, setFilter] = useState<string>("");
  const wasOk = useRef(false);

  const isGala = marketType === "tournament_winner" || fixedStake != null;

  useEffect(() => {
    if (state.ok && !wasOk.current) {
      wasOk.current = true;
      toast.success(
        editing
          ? "Pick updated!"
          : isGala
            ? "You're in the Grand Gala!"
            : "Bet placed!",
      );
    }
  }, [state.ok, isGala, editing]);

  // Client-side hint only (normal markets); server is the source of truth.
  const stakeNum = Number(stake);
  const balNum = Number(availableBalance);
  let hint: string | null = null;
  if (!isGala && stake !== "" && Number.isFinite(stakeNum)) {
    if (stakeNum <= 0) hint = "Bet must be greater than zero.";
    else if (stakeNum < Number(minBet)) hint = `Min bet is ${format(minBet, currencyName)}.`;
    else if (stakeNum > Number(maxBet)) hint = `Max bet is ${format(maxBet, currencyName)}.`;
    else if (stakeNum > balNum) hint = `You only have ${format(availableBalance, currencyName)}.`;
  }
  const galaShort = isGala && fixedStake != null && Number(fixedStake) > balNum;

  const visibleOutcomes =
    isGala && filter
      ? outcomes.filter((o) => o.label.toLowerCase().includes(filter.toLowerCase()))
      : outcomes;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-lg border border-border bg-card p-4"
    >
      <input type="hidden" name="clanId" value={clanId} />
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="outcomeId" value={outcomeId} />
      {/* Server ignores this for gala (uses fixed stake) but include for parity. */}
      <input type="hidden" name="stake" value={isGala ? (fixedStake ?? "") : stake} />

      <div className="flex flex-col gap-2">
        <Label className="kicker">{isGala ? "Pick the Champion" : "Your Pick"}</Label>

        {isGala ? (
          <Input
            type="text"
            placeholder="Search teams…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Search teams"
          />
        ) : null}

        <div
          className={cn(
            "flex flex-wrap gap-2",
            isGala && "max-h-72 overflow-y-auto border border-grid p-2",
          )}
        >
          {visibleOutcomes.map((o) => {
            const active = o.id === outcomeId;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setOutcomeId(o.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted",
                )}
              >
                {o.label !== "Draw" ? <Flag team={o.label} size="sm" /> : null}
                {o.label}
              </button>
            );
          })}
          {visibleOutcomes.length === 0 ? (
            <p className="dateline px-1 py-2">No teams match “{filter}”.</p>
          ) : null}
        </div>
      </div>

      {isGala ? (
        <div className="rounded-md border border-border bg-background p-3">
          <p className="kicker">Fixed entry</p>
          <p className="mt-1 text-lg">
            <span className="tabular font-semibold text-primary">
              {format(fixedStake ?? "0", currencyName)}
            </span>{" "}
            <span className="text-muted-foreground">to enter · you have</span>{" "}
            <span className="tabular">{format(availableBalance, currencyName)}</span>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stake" className="kicker">
            Stake
          </Label>
          <Input
            id="stake"
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
            Min <span className="tabular">{format(minBet, currencyName)}</span> · Max{" "}
            <span className="tabular">{format(maxBet, currencyName)}</span> · You have{" "}
            <span className="tabular">{format(availableBalance, currencyName)}</span>
          </p>
        </div>
      )}

      {hint ? (
        <p className="border-l-2 border-danger px-2 py-1 text-xs font-medium text-danger">
          {hint}
        </p>
      ) : null}
      {galaShort ? (
        <p className="border-l-2 border-danger px-2 py-1 text-xs font-medium text-danger">
          You need {format(fixedStake ?? "0", currencyName)} to enter — you only have{" "}
          {format(availableBalance, currencyName)}.
        </p>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-danger bg-danger/10 px-3 py-2 text-sm font-medium text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending || !outcomeId} className="w-full">
        {pending
          ? "Saving…"
          : editing
            ? isGala
              ? "Update Entry"
              : "Update Pick"
            : isGala
              ? "Enter the Grand Gala"
              : "Lock It In"}
      </Button>
      {editing ? (
        <p className="dateline text-center">
          You can change your pick any time before kickoff.
        </p>
      ) : null}
    </form>
  );
}
