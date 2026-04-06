import { FastifyInstance, FastifyRequest } from 'fastify';
import { and, eq, inArray } from 'drizzle-orm';
import createError from 'http-errors';
import {
    ERROR_MESSAGES,
    MessageResponseSchema,
    VoteRequest,
    VoteRequestSchema,
    VoteResponse,
    VoteResponseSchema,
} from '@okay-vote/contracts';

import { choices, polls, votes as votesTable } from 'db/schema';
import { isConstraintViolation } from 'utils/db';
import { uuidRegex } from 'utils/validation';

const schema = {
    body: VoteRequestSchema,
    response: {
        200: VoteResponseSchema,
        400: MessageResponseSchema,
        404: MessageResponseSchema,
        409: MessageResponseSchema,
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
            try {
                const { pollId } = req.params;
                const voterName = req.body.voterName.trim();
                const votes = Object.fromEntries(
                    Object.entries(req.body.votes).map(
                        ([choiceName, score]) => [choiceName.trim(), score],
                    ),
                );
                const requestedChoiceNames = Object.keys(votes);

                if (!uuidRegex.test(pollId)) {
                    throw createError(400, ERROR_MESSAGES.invalidPollId);
                }

                if (!voterName) {
                    throw createError(400, ERROR_MESSAGES.voterNameRequired);
                }

                const existingPoll = await fastify.db.query.polls.findFirst({
                    where: eq(polls.id, pollId),
                    columns: {
                        id: true,
                    },
                });

                if (!existingPoll) {
                    throw createError(404, ERROR_MESSAGES.pollNotFound);
                }

                if (requestedChoiceNames.length === 0) {
                    throw createError(400, ERROR_MESSAGES.emptyVoteSubmission);
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
                    throw createError(400, ERROR_MESSAGES.noValidVotes);
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
            } catch (error) {
                if (
                    isConstraintViolation(
                        error,
                        'votes_poll_id_choice_id_voter_name_unique',
                    )
                ) {
                    throw createError(
                        409,
                        ERROR_MESSAGES.duplicateVoteSubmission,
                    );
                }

                throw error;
            }
        },
    );
};

export default voteRoute;
