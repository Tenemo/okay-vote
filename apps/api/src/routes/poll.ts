import type { FastifyInstance } from 'fastify';
import { asc, eq } from 'drizzle-orm';
import createError from 'http-errors';
import {
    ERROR_MESSAGES,
    MessageResponseSchema,
    PollResponse,
    PollResponseSchema,
} from '@okay-vote/contracts';

import { buildPollResponse } from 'domain/polls/fetch';
import { polls } from 'db/schema';
import { uuidRegex } from 'utils/validation';

const schema = {
    response: {
        200: PollResponseSchema,
        404: MessageResponseSchema,
    },
};

const pollRoute = async (fastify: FastifyInstance): Promise<void> => {
    fastify.get<{ Params: { pollRef: string } }>(
        '/polls/:pollRef',
        { schema },
        async (req): Promise<PollResponse> => {
            const { pollRef } = req.params;
            const whereClause = uuidRegex.test(pollRef)
                ? eq(polls.id, pollRef)
                : eq(polls.slug, pollRef);

            const poll = await fastify.db.query.polls.findFirst({
                where: whereClause,
                columns: {
                    id: true,
                    slug: true,
                    pollName: true,
                    createdAt: true,
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

            if (!poll) {
                throw createError(404, ERROR_MESSAGES.pollNotFound);
            }

            return buildPollResponse(poll);
        },
    );
};

export default pollRoute;
