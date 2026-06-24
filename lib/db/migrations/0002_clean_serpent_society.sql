ALTER TABLE "clans" ALTER COLUMN "default_max_bet" SET DEFAULT '500';--> statement-breakpoint
ALTER TABLE "clans" ADD COLUMN "default_min_bet" numeric DEFAULT '100' NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "stage" text DEFAULT 'group' NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "round" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "group_label" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "min_bet" numeric;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_stage_chk" CHECK ("matches"."stage" in ('group','knockout'));