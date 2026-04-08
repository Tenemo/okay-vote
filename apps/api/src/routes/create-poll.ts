import type { FastifyInstance } from 'fastify';
import createError from 'http-errors';
import {
    ERROR_MESSAGES,
    CreatePollRequest,
    CreatePollRequestSchema,
    CreatePollResponse,
    CreatePollResponseSchema,
    MessageResponseSchema,
} from '@okay-vote/contracts';

import {
    normalizeCreatePollInput,
    validateCreatePollInput,
} from 'domain/polls/create';
import { createOrganizerToken } from 'domain/polls/end';
import { choices, polls } from 'db/schema';
import { isConstraintViolation } from 'utils/db';
import * as pollIdUtils from 'utils/poll-id';
import { getPollSlugCandidates } from 'utils/slug';

const schema = {
    body: CreatePollRequestSchema,
    response: {
        200: CreatePollResponseSchema,
        400: MessageResponseSchema,
        500: MessageResponseSchema,
    },
};

const createPollRoute = async (fastify: FastifyInstance): Promise<void> => {
    fastify.post<{ Body: CreatePollRequest }>(
        '/polls/create',
        { schema },
        async (req): Promise<CreatePollResponse> => {
            const normalizedInput = normalizeCreatePollInput(req.body);
            validateCreatePollInput(normalizedInput);

            const { pollName, choices: pollChoices } = normalizedInput;

            const pollId = pollIdUtils.generatePollId();
            const { organizerToken, organizerTokenHash } =
                createOrganizerToken();

            for (const slug of getPollSlugCandidates(pollName, pollId)) {
                try {
                    const createdPoll = await fastify.db.transaction(
                        async (tx) => {
                            const [insertedPoll] = await tx
                                .insert(polls)
                                .values({
                                    id: pollId,
                                    pollName,
                                    slug,
                                    organizerTokenHash,
                                })
                                .returning({
                                    id: polls.id,
                                    slug: polls.slug,
                                    createdAt: polls.createdAt,
                                });

                            await tx.insert(choices).values(
                                pollChoices.map((choiceName) => ({
                                    choiceName,
                                    pollId: insertedPoll.id,
                                })),
                            );

                            return insertedPoll;
                        },
                    );

                    return {
                        pollName,
                        choices: pollChoices,
                        id: createdPoll.id,
                        slug: createdPoll.slug,
                        createdAt: createdPoll.createdAt,
                        organizerToken,
                    };
                } catch (error) {
                    if (isConstraintViolation(error, 'polls_slug_unique')) {
                        continue;
                    }

                    throw error;
                }
            }

            fastify.log.error(
                { pollId, pollName },
                'Failed to create poll because all generated slug candidates collided.',
            );
            throw createError(500, ERROR_MESSAGES.pollSlugGenerationFailed);
        },
    );
};

export default createPollRoute;
