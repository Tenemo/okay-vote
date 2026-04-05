BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS polls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_name text NOT NULL UNIQUE,
    created_at timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS choices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    choice_name text NOT NULL,
    created_at timestamp NOT NULL DEFAULT NOW(),
    poll_id uuid NOT NULL,
    CONSTRAINT fk_poll_id FOREIGN KEY (poll_id) REFERENCES polls (id),
    UNIQUE (poll_id, choice_name)
);

CREATE TABLE IF NOT EXISTS votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_name text NOT NULL,
    score integer NOT NULL,
    CHECK (
        score BETWEEN 1
        AND 10
    ),
    created_at timestamp NOT NULL DEFAULT NOW(),
    poll_id uuid NOT NULL,
    CONSTRAINT fk_poll_id FOREIGN KEY (poll_id) REFERENCES polls (id),
    choice_id uuid NOT NULL,
    CONSTRAINT fk_choice_id FOREIGN KEY (choice_id) REFERENCES choices (id),
    UNIQUE (poll_id, choice_id, voter_name)
);

COMMIT;
