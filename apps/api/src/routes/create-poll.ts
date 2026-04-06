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

import { choices, polls } from 'db/schema';
import { isConstraintViolation } from 'utils/db';
import * as pollIdUtils from 'utils/poll-id';
import { getPollSlugCandidates } from 'utils/slug';

const schema = {
    body: CreatePollRequestSchema,
    response: {
        200: CreatePollResponseSchema,
        400: MessageResponseSchema,
    },
};

const createPollRoute = async (fastify: FastifyInstance): Promise<void> => {
    fastify.post<{ Body: CreatePollRequest }>(
        '/polls/create',
        { schema },
        async (req): Promise<CreatePollResponse> => {
            const pollName = req.body.pollName.trim();
            const pollChoices = req.body.choices.map((choice) => choice.trim());

            if (!pollName) {
                throw createError(400, ERROR_MESSAGES.pollNameRequired);
            }

            if (pollChoices.length < 2) {
                throw createError(400, ERROR_MESSAGES.notEnoughChoices);
            }

            if (pollChoices.some((choice) => !choice)) {
                throw createError(400, ERROR_MESSAGES.choiceNamesRequired);
            }

            if (new Set(pollChoices).size !== pollChoices.length) {
                throw createError(400, ERROR_MESSAGES.duplicateChoiceNames);
            }

            const pollId = pollIdUtils.generatePollId();

            for (const slug of getPollSlugCandidates(pollName, pollId)) {
                try {
                    const createdPoll = await fastify.db.transaction(
                        async (tx) => {
                            const [insertedPoll] = await tx
                                .insert(polls)
                                .values({ id: pollId, pollName, slug })
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
                    };
                } catch (error) {
                    if (isConstraintViolation(error, 'polls_slug_unique')) {
                        continue;
                    }

                    throw error;
                }
            }

            throw createError(500);
        },
    );
};

export default createPollRoute;
