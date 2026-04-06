ALTER TABLE "polls" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_slug_unique" UNIQUE("slug");