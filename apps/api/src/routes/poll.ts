import { FastifyInstance, FastifyRequest } from 'fastify';
import { asc, eq } from 'drizzle-orm';
import createError from 'http-errors';
import gmean from 'gmean';
import {
    ERROR_MESSAGES,
    MessageResponseSchema,
    PollResponse,
    PollResponseSchema,
} from '@okay-vote/contracts';

import { polls } from 'db/schema';
import { uuidRegex } from 'utils/validation';

const schema = {
    response: {
        200: PollResponseSchema,
        400: MessageResponseSchema,
        404: MessageResponseSchema,
    },
};

const pollRoute = async (fastify: FastifyInstance): Promise<void> => {
    fastify.get(
        '/polls/:pollId',
        { schema },
        async (
            req: FastifyRequest<{ Params: { pollId: string } }>,
        ): Promise<PollResponse> => {
            const { pollId } = req.params;

            if (!uuidRegex.test(pollId)) {
                throw createError(400, ERROR_MESSAGES.invalidPollId);
            }

            const poll = await fastify.db.query.polls.findFirst({
                where: eq(polls.id, pollId),
                columns: {
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

            const voters = Array.from(
                new Set(poll.votes.map(({ voterName }) => voterName)),
            );
            const resultsByChoice = poll.votes.reduce<Record<string, number[]>>(
                (acc, { choice, score }) => {
                    const choiceName = choice.choiceName;

                    if (!acc[choiceName]) {
                        return { ...acc, [choiceName]: [score] };
                    }

                    return {
                        ...acc,
                        [choiceName]: [...acc[choiceName], score],
                    };
                },
                {},
            );
            const results = Object.entries(resultsByChoice).reduce<
                Record<string, number>
            >(
                (acc, [choiceName, scores]) => ({
                    ...acc,
                    [choiceName]: Number(gmean(scores).toFixed(2)),
                }),
                {},
            );
            const choices = Array.from(
                new Set(poll.choices.map(({ choiceName }) => choiceName)),
            );

            if (voters.length < 2) {
                return {
                    pollName: poll.pollName,
                    createdAt: poll.createdAt,
                    choices,
                    voters,
                };
            }

            return {
                pollName: poll.pollName,
                createdAt: poll.createdAt,
                choices,
                results,
                voters,
            };
        },
    );
};

export default pollRoute;
