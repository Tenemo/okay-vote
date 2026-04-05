import { relations, sql } from 'drizzle-orm';
import {
    check,
    integer,
    pgTable,
    text,
    timestamp,
    unique,
    uuid,
} from 'drizzle-orm/pg-core';

export const polls = pgTable(
    'polls',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        pollName: text('poll_name').notNull(),
        createdAt: timestamp('created_at', { mode: 'string' })
            .defaultNow()
            .notNull(),
    },
    (table) => [unique('polls_poll_name_unique').on(table.pollName)],
);

export const choices = pgTable(
    'choices',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        choiceName: text('choice_name').notNull(),
        createdAt: timestamp('created_at', { mode: 'string' })
            .defaultNow()
            .notNull(),
        pollId: uuid('poll_id')
            .notNull()
            .references(() => polls.id),
    },
    (table) => [
        unique('choices_poll_id_choice_name_unique').on(
            table.pollId,
            table.choiceName,
        ),
    ],
);

export const votes = pgTable(
    'votes',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        voterName: text('voter_name').notNull(),
        score: integer('score').notNull(),
        createdAt: timestamp('created_at', { mode: 'string' })
            .defaultNow()
            .notNull(),
        pollId: uuid('poll_id')
            .notNull()
            .references(() => polls.id),
        choiceId: uuid('choice_id')
            .notNull()
            .references(() => choices.id),
    },
    (table) => [
        check(
            'votes_score_between_1_and_10',
            sql`${table.score} between 1 and 10`,
        ),
        unique('votes_poll_id_choice_id_voter_name_unique').on(
            table.pollId,
            table.choiceId,
            table.voterName,
        ),
    ],
);

export const pollsRelations = relations(polls, ({ many }) => ({
    choices: many(choices),
    votes: many(votes),
}));

export const choicesRelations = relations(choices, ({ one, many }) => ({
    poll: one(polls, {
        fields: [choices.pollId],
        references: [polls.id],
    }),
    votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
    poll: one(polls, {
        fields: [votes.pollId],
        references: [polls.id],
    }),
    choice: one(choices, {
        fields: [votes.choiceId],
        references: [choices.id],
    }),
}));
