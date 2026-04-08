import { asc, eq } from 'drizzle-orm';

import type { Database } from 'db/connection';
import { polls } from 'db/schema';
import { UUID_REGEX } from '@okay-vote/contracts';

import type { PollRecord } from './fetch';

export type PollDetailsRecord = PollRecord & {
    organizerTokenHash: string | null;
};

export type PollStatusRecord = {
    endedAt: string | null;
    id: string;
};

export const buildPollRefWhereClause = (
    pollRef: string,
): ReturnType<typeof eq> =>
    UUID_REGEX.test(pollRef) ? eq(polls.id, pollRef) : eq(polls.slug, pollRef);

export const findPollDetailsByRef = async (
    db: Database,
    pollRef: string,
): Promise<PollDetailsRecord | null> => {
    const poll = await db.query.polls.findFirst({
        where: buildPollRefWhereClause(pollRef),
        columns: {
            id: true,
            slug: true,
            pollName: true,
            createdAt: true,
            endedAt: true,
            organizerTokenHash: true,
        },
        with: {
            choices: {
                columns: {
                    choiceName: true,
                },
                orderBy: (fields) => asc(fields.createdAt),
            },
            votes: {
                columns: {
                    voterName: true,
                    score: true,
                },
                with: {
                    choice: {
                        columns: {
                            choiceName: true,
                        },
                    },
                },
                orderBy: (fields) => asc(fields.createdAt),
            },
        },
    });

    return poll ?? null;
};

export const findPollStatusByRef = async (
    db: Database,
    pollRef: string,
): Promise<PollStatusRecord | null> =>
    (await db.query.polls.findFirst({
        where: buildPollRefWhereClause(pollRef),
        columns: {
            id: true,
            endedAt: true,
        },
    })) ?? null;

export const findPollEndedAtById = async (
    db: Database,
    pollId: string,
): Promise<string | null> => {
    const poll = await db.query.polls.findFirst({
        where: eq(polls.id, pollId),
        columns: {
            endedAt: true,
        },
    });

    return poll?.endedAt ?? null;
};
