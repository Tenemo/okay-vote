ALTER TABLE "polls" ADD COLUMN "organizer_token_hash" text;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "ended_at" timestamp;--> statement-breakpoint
UPDATE "polls" SET "ended_at" = now();
