import { FastifyInstance, FastifyRequest } from 'fastify';
import { and, eq, inArray } from 'drizzle-orm';
import createError from 'http-errors';
import {
    VoteRequest,
    VoteRequestSchema,
    VoteResponse,
    VoteResponseSchema,
} from '@okay-vote/contracts';

import { choices, polls, votes as votesTable } from 'db/schema';

const schema = {
    body: VoteRequestSchema,
    response: {
        200: VoteResponseSchema,
    },
};

const voteRoute = async (fastify: FastifyInstance): Promise<void> => {
    fastify.post(
        '/polls/:pollId/vote',
        { schema },
        async (
            req: FastifyRequest<{
                Body: VoteRequest;
                Params: { pollId: string };
            }>,
        ): Promise<VoteResponse> => {
            const { votes, voterName } = req.body;
            const { pollId } = req.params;
            const requestedChoiceNames = Object.keys(votes);

            const existingPoll = await fastify.db.query.polls.findFirst({
                where: eq(polls.id, pollId),
                columns: {
                    id: true,
                },
            });

            if (!existingPoll) {
                throw createError(
                    400,
                    `Poll with ID ${pollId} does not exist.`,
                );
            }

            if (requestedChoiceNames.length === 0) {
                throw createError(400, 'You must submit at least one vote.');
            }

            const availableChoices = await fastify.db
                .select({
                    id: choices.id,
                    choiceName: choices.choiceName,
                })
                .from(choices)
                .where(
                    and(
                        eq(choices.pollId, pollId),
                        inArray(choices.choiceName, requestedChoiceNames),
                    ),
                );
            const correctVotes = Object.entries(votes).reduce<
                Array<{ choiceId: string; score: number }>
            >((acc, [choiceName, score]) => {
                const choiceId = availableChoices.find(
                    (choice) => choice.choiceName === choiceName,
                )?.id;

                if (!choiceId) {
                    return acc;
                }

                return [...acc, { choiceId, score }];
            }, []);

            if (correctVotes.length === 0) {
                throw createError(
                    400,
                    'You must submit at least one valid vote.',
                );
            }

            await fastify.db.insert(votesTable).values(
                correctVotes.map(({ choiceId, score }) => ({
                    voterName,
                    score,
                    pollId,
                    choiceId,
                })),
            );

            return `Voted successfully in vote ${pollId}.`;
        },
    );
};

export default voteRoute;
