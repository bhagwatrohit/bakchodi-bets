ALTER TABLE "matches" ADD COLUMN "market_type" text DEFAULT 'match' NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "fixed_stake" numeric;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_market_chk" CHECK ("matches"."market_type" in ('match','tournament_winner'));