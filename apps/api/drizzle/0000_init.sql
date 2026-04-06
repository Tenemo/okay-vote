CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint
CREATE TABLE "choices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"choice_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"poll_id" uuid NOT NULL,
	CONSTRAINT "choices_poll_id_choice_name_unique" UNIQUE("poll_id","choice_name")
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "polls_poll_name_unique" UNIQUE("poll_name")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voter_name" text NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"poll_id" uuid NOT NULL,
	"choice_id" uuid NOT NULL,
	CONSTRAINT "votes_poll_id_choice_id_voter_name_unique" UNIQUE("poll_id","choice_id","voter_name"),
	CONSTRAINT "votes_score_between_1_and_10" CHECK ("votes"."score" between 1 and 10)
);
--> statement-breakpoint
ALTER TABLE "choices" ADD CONSTRAINT "choices_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_choice_id_choices_id_fk" FOREIGN KEY ("choice_id") REFERENCES "public"."choices"("id") ON DELETE no action ON UPDATE no action;
