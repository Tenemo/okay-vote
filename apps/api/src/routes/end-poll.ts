import type { FastifyInstance } from 'fastify';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import createError from 'http-errors';
import {
    ERROR_MESSAGES,
    EndPollRequest,
    EndPollRequestSchema,
    MessageResponseSchema,
    PollResponse,
    PollResponseSchema,
    UUID_REGEX,
} from '@okay-vote/contracts';

import {
    matchesOrganizerToken,
    normalizeOrganizerToken,
    validateOrganizerToken,
} from 'domain/polls/end';
import { buildPollResponse } from 'domain/polls/fetch';
import { polls } from 'db/schema';

const schema = {
    body: EndPollRequestSchema,
    response: {
        200: PollResponseSchema,
        400: MessageResponseSchema,
        403: MessageResponseSchema,
        404: MessageResponseSchema,
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

            const whereClause = UUID_REGEX.test(pollRef)
                ? eq(polls.id, pollRef)
                : eq(polls.slug, pollRef);

            const poll = await fastify.db.query.polls.findFirst({
                where: whereClause,
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
                const persistedPoll = await fastify.db.query.polls.findFirst({
                    where: eq(polls.id, poll.id),
                    columns: {
                        endedAt: true,
                    },
                });

                return buildPollResponse({
                    ...poll,
                    endedAt: persistedPoll?.endedAt ?? poll.endedAt,
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
