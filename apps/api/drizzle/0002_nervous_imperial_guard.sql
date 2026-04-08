ALTER TABLE "polls" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "polls"
SET "slug" = CONCAT(
	COALESCE(
		NULLIF(
			trim(BOTH '-' FROM regexp_replace(
				left(
					regexp_replace(
						lower(regexp_replace("poll_name", '[^a-zA-Z0-9]+', '-', 'g')),
						'-{2,}',
						'-',
						'g'
					),
					32
				),
				'-{2,}',
				'-',
				'g'
			)),
			''
		),
		'vote'
	),
	'--',
	replace("id"::text, '-', '')
);--> statement-breakpoint
ALTER TABLE "polls" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_slug_unique" UNIQUE("slug");
