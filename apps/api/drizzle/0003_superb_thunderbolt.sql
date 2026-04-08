ALTER TABLE "polls" ADD COLUMN "organizer_token_hash" text;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "ended_at" timestamp;--> statement-breakpoint
-- Legacy polls predate organizer tokens, so they are backfilled as ended.
UPDATE "polls" SET "ended_at" = now() WHERE "organizer_token_hash" IS NULL;
