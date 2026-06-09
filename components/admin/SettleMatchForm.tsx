"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  lockMatchAction,
  unlockMatchAction,
  settleMatchAction,
  voidMatchAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import type { MatchListItem } from "@/lib/types";

const initial: AdminActionState = {};

function statusBadge(status: MatchListItem["status"]) {
  switch (status) {
    case "open":
      return <span className="stamp text-ink">Open</span>;
    case "locked":
      return <span className="stamp text-ink-soft">Locked</span>;
    case "final":
      return <span className="stamp text-accent">Final</span>;
    case "settled":
      return <span className="stamp text-success">Settled</span>;
  }
}

/** Small form wrapper that fires one admin action on submit and toasts on ok. */
function ActionForm({
  action,
  clanId,
  matchId,
  okMessage,
  children,
}: {
  action: (prev: AdminActionState, fd: FormData) => Promise<AdminActionState>;
  clanId: string;
  matchId: string;
  okMessage: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, initial);
  const lastOk = useRef(false);
  useEffect(() => {
    if (state.ok && !lastOk.current) toast.success(okMessage);
    if (state.error) toast.error(state.error);
    lastOk.current = !!state.ok;
  }, [state.ok, state.error, okMessage]);
  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="clanId" value={clanId} />
      <input type="hidden" name="matchId" value={matchId} />
      {children}
    </form>
  );
}

export function SettleMatchForm({
  clanId,
  match,
}: {
  clanId: string;
  match: MatchListItem;
}) {
  const [settleState, settleAction, settlePending] = useActionState(settleMatchAction, initial);
  const lastSettleOk = useRef(false);
  useEffect(() => {
    if (settleState.ok && !lastSettleOk.current) toast.success("Chaos settled — winners paid out.");
    lastSettleOk.current = !!settleState.ok;
  }, [settleState.ok]);

  const settled = match.status === "settled";
  const winningOutcome = match.outcomes.find((o) => o.id === match.winningOutcomeId);

  return (
    <div className="flex flex-col gap-3 border-2 border-ink p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{match.title}</p>
          <p className="dateline mt-0.5">
            {match.betCount} bet{match.betCount === 1 ? "" : "s"}
            {settled && winningOutcome ? ` · won by ${winningOutcome.label}` : null}
          </p>
        </div>
        {statusBadge(match.status)}
      </div>

      {settled ? (
        <p className="text-sm italic text-ink-soft">
          Story&apos;s gone to press — nothing more to do here.
        </p>
      ) : (
        <>
          {/* Lock / unlock */}
          <div className="flex flex-wrap gap-2">
            {match.status === "open" ? (
              <ActionForm
                action={lockMatchAction}
                clanId={clanId}
                matchId={match.id}
                okMessage="Betting locked."
              >
                <Button type="submit" variant="outline" size="sm">
                  Lock the Lines
                </Button>
              </ActionForm>
            ) : (
              <ActionForm
                action={unlockMatchAction}
                clanId={clanId}
                matchId={match.id}
                okMessage="Betting re-opened."
              >
                <Button type="submit" variant="outline" size="sm">
                  Re-open the Lines
                </Button>
              </ActionForm>
            )}

            <ActionForm
              action={voidMatchAction}
              clanId={clanId}
              matchId={match.id}
              okMessage="Match voided — everyone got their stake back."
            >
              <Button type="submit" variant="danger" size="sm">
                Spike the Story
              </Button>
            </ActionForm>
          </div>

          {/* Settle */}
          <form action={settleAction} className="flex flex-col gap-2 border-t-2 border-ink pt-3">
            <input type="hidden" name="clanId" value={clanId} />
            <input type="hidden" name="matchId" value={match.id} />
            <p className="kicker">Call the Result</p>
            <div className="flex flex-col gap-1.5">
              {match.outcomes.map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-2 border border-ink px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <input
                    type="radio"
                    name="winningOutcomeId"
                    value={o.id}
                    required
                    className="h-4 w-4 accent-accent"
                  />
                  {o.label} won
                </label>
              ))}
            </div>
            {settleState.error ? (
              <p className="stamp w-fit text-danger">{settleState.error}</p>
            ) : null}
            <Button type="submit" variant="success" size="sm" disabled={settlePending}>
              {settlePending ? "Calling It…" : "Call It & Pay Out"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
