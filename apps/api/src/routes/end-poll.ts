import type { FastifyInstance } from 'fastify';
import { and, eq, isNull, sql } from 'drizzle-orm';
import createError from 'http-errors';
import {
    ERROR_MESSAGES,
    EndPollRequest,
    EndPollRequestSchema,
    MessageResponseSchema,
    PollResponse,
    PollResponseSchema,
} from '@okay-vote/contracts';

import {
    hasEnoughVotersToEndPoll,
    matchesOrganizerToken,
    normalizeOrganizerToken,
    validateOrganizerToken,
} from 'domain/polls/end';
import { buildPollResponse } from 'domain/polls/fetch';
import {
    findPollDetailsByRef,
    findPollEndedAtById,
} from 'domain/polls/queries';
import { polls } from 'db/schema';

const schema = {
    body: EndPollRequestSchema,
    response: {
        200: PollResponseSchema,
        400: MessageResponseSchema,
        403: MessageResponseSchema,
        404: MessageResponseSchema,
        409: MessageResponseSchema,
    },
};

const endPollRoute = async (fastify: FastifyInstance): Promise<void> => {
    fastify.post<{
        Body: EndPollRequest;
        Params: { pollRef: string };
    }>(
        '/polls/:pollRef/end',
        { schema },
        async (req): Promise<PollResponse> => {
            const { pollRef } = req.params;
            const organizerToken = normalizeOrganizerToken(
                req.body.organizerToken,
            );

            validateOrganizerToken(organizerToken);
            const poll = await findPollDetailsByRef(fastify.db, pollRef);

            if (!poll) {
                throw createError(404, ERROR_MESSAGES.pollNotFound);
            }

            if (
                !matchesOrganizerToken({
                    organizerToken,
                    organizerTokenHash: poll.organizerTokenHash,
                })
            ) {
                throw createError(
                    403,
                    ERROR_MESSAGES.organizerUnauthorizedToEndPoll,
                );
            }

            if (poll.endedAt) {
                return buildPollResponse(poll);
            }

            if (!hasEnoughVotersToEndPoll(poll.votes)) {
                throw createError(409, ERROR_MESSAGES.notEnoughVotersToEndPoll);
            }

            const [updatedPoll] = await fastify.db
                .update(polls)
                .set({
                    endedAt: sql`now()`,
                })
                .where(and(eq(polls.id, poll.id), isNull(polls.endedAt)))
                .returning({
                    endedAt: polls.endedAt,
                });

            if (!updatedPoll?.endedAt) {
                return buildPollResponse({
                    ...poll,
                    endedAt:
                        (await findPollEndedAtById(fastify.db, poll.id)) ??
                        poll.endedAt,
                });
            }

            return buildPollResponse({
                ...poll,
                endedAt: updatedPoll.endedAt,
            });
        },
    );
};

export default endPollRoute;
