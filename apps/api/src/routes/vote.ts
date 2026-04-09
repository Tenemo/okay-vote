import type { FastifyInstance } from 'fastify';
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

import {
    assertHasStoredVotes,
    getStoredVotes,
    normalizeVoteSubmission,
    validateVoteSubmission,
} from 'domain/polls/vote';
import { findPollStatusByRef } from 'domain/polls/queries';
import { choices, votes as votesTable } from 'db/schema';
import { isConstraintViolation } from 'utils/db';

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
    fastify.post<{
        Body: VoteRequest;
        Params: { pollRef: string };
    }>(
        '/polls/:pollRef/vote',
        { schema },
        async (req): Promise<VoteResponse> => {
            try {
                const { pollRef } = req.params;
                const { voterName, votes } = normalizeVoteSubmission(req.body);
                validateVoteSubmission({
                    pollRef,
                    voterName,
                    votes,
                });

                const requestedChoiceNames = Object.keys(votes);
                const existingPoll = await findPollStatusByRef(
                    fastify.db,
                    pollRef,
                );

                if (!existingPoll) {
                    throw createError(404, ERROR_MESSAGES.pollNotFound);
                }

                if (existingPoll.endedAt) {
                    throw createError(409, ERROR_MESSAGES.pollEnded);
                }

                const availableChoices = await fastify.db
                    .select({
                        id: choices.id,
                        choiceName: choices.choiceName,
                    })
                    .from(choices)
                    .where(
                        and(
                            eq(choices.pollId, existingPoll.id),
                            inArray(choices.choiceName, requestedChoiceNames),
                        ),
                    );
                const correctVotes = getStoredVotes(votes, availableChoices);
                assertHasStoredVotes(correctVotes);

                await fastify.db.insert(votesTable).values(
                    correctVotes.map(({ choiceId, score }) => ({
                        voterName,
                        score,
                        pollId: existingPoll.id,
                        choiceId,
                    })),
                );

                return `Voted successfully in vote ${existingPoll.id}.`;
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
