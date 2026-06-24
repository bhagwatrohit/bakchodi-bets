ALTER TABLE "clans" ALTER COLUMN "default_max_bet" SET DEFAULT '500';--> statement-breakpoint
ALTER TABLE "clans" ADD COLUMN "default_min_bet" numeric DEFAULT '100' NOT NULL;--> statement-breakpoint
-- Backfill: existing clans still on the old default max (100) would otherwise be
-- trapped at min=max=100. Lift them to the new 100-500 range. Only touches clan
-- config rows still at the old default; never affects bets/ledger/settlement.
UPDATE "clans" SET "default_max_bet" = '500' WHERE "default_max_bet" = '100';--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "stage" text DEFAULT 'group' NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "round" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "group_label" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "min_bet" numeric;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_stage_chk" CHECK ("matches"."stage" in ('group','knockout'));