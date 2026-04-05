import { FastifyInstance, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import createError from 'http-errors';
import gmean from 'gmean';
import { PollResponse, PollResponseSchema } from '@okay-vote/contracts';

import { polls } from 'db/schema';

const schema = {
    response: {
        200: PollResponseSchema,
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
                    },
                },
            });

            if (!poll) {
                throw createError(
                    400,
                    `Vote with ID ${pollId} does not exist.`,
                );
            }

            const voters = Array.from(
                new Set(poll.votes.map(({ voterName }) => voterName)),
            );
            const resultsWithScores = poll.votes.reduce<
                Record<string, number[]>
            >((acc, { choice, score }) => {
                const choiceName = choice.choiceName;

                if (!acc[choiceName]) {
                    return { ...acc, [choiceName]: [score] };
                }

                return {
                    ...acc,
                    [choiceName]: [...acc[choiceName], score],
                };
            }, {});
            const results = Object.entries(resultsWithScores).reduce<
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
