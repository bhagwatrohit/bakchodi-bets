import type { Money } from "@/lib/money";

export type ClanRole = "admin" | "member";
export type MatchStatus = "open" | "locked" | "final" | "settled";
export type BetStatus = "pending" | "won" | "lost" | "void";
export type LedgerType =
  | "initial_balance"
  | "bet_placed"
  | "bet_won_payout"
  | "bet_void_refund"
  | "admin_adjustment";

export interface SessionProfile {
  id: string;
  displayName: string;
  email: string;
}

export interface ClanSettings {
  lockBetsAtMatchStart: boolean;
  showBetsBeforeLock: boolean;
  showBetsAfterLock: boolean;
  defaultMaxBet: Money;
  currencyName: string;
  name: string;
}

export interface Clan {
  id: string;
  name: string;
  createdBy: string;
  currencyName: string;
  startingBalance: Money;
  defaultMaxBet: Money;
  lockBetsAtMatchStart: boolean;
  showBetsBeforeLock: boolean;
  showBetsAfterLock: boolean;
  inviteCode: string;
  isGlobalPool: boolean;
  createdAt: Date;
}

export interface ClanMember {
  id: string;
  clanId: string;
  userId: string;
  role: ClanRole;
  balance: Money;
  joinedAt: Date;
}

/** Card data for the dashboard. */
export interface ClanCardData {
  clanId: string;
  name: string;
  currencyName: string;
  balance: Money;
  rank: number;
  memberCount: number;
  openMatchCount: number;
  role: ClanRole;
}

export interface MatchOutcome {
  id: string;
  label: string;
  sortOrder: number;
}

/** A bet summarized for the current viewer. */
export interface ViewerBet {
  id: string;
  outcomeId: string;
  outcomeLabel: string;
  stake: Money;
  status: BetStatus;
  payout: Money;
  profit: Money;
}

export interface MatchListItem {
  id: string;
  title: string;
  teamA: string;
  teamB: string;
  startsAt: Date;
  status: MatchStatus; // stored status (source of truth for admin/settlement)
  /**
   * Status to SHOW: a still-`open` match whose kickoff has passed in a
   * lock-at-start clan is shown as `locked` (betting auto-closes at kickoff
   * without a background job). Use this for badges, CTAs, and bucketing.
   */
  displayStatus: MatchStatus;
  maxBet: Money; // effective: match override or clan default
  outcomes: MatchOutcome[];
  winningOutcomeId: string | null;
  myBet: ViewerBet | null;
  totalPot: Money;
  betCount: number;
}

export interface MatchDetail extends MatchListItem {
  availableBalance: Money;
  currencyName: string;
  clanLockAtStart: boolean;
}

export interface BetHistoryRow {
  id: string;
  matchId: string;
  matchTitle: string;
  teamA: string;
  teamB: string;
  pick: string; // outcome label
  stake: Money;
  status: BetStatus;
  payout: Money;
  profit: Money;
  createdAt: Date;
  userId: string;
  displayName: string;
}

export interface LeaderboardRow {
  rank: number;
  userId: string;
  displayName: string;
  balance: Money;
  betsPlaced: number;
  wins: number;
  losses: number;
  netChange: Money; // balance - startingBalance
  biggestWin: Money; // largest single payout-profit
  isMe: boolean;
}
