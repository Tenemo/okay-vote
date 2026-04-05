import { FastifyInstance, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import createError from 'http-errors';
import {
    CreatePollRequest,
    CreatePollRequestSchema,
    CreatePollResponse,
    CreatePollResponseSchema,
} from '@okay-vote/contracts';

import { choices, polls } from 'db/schema';

const schema = {
    body: CreatePollRequestSchema,
    response: {
        200: CreatePollResponseSchema,
    },
};

const createPollRoute = async (fastify: FastifyInstance): Promise<void> => {
    fastify.post(
        '/polls/create',
        { schema },
        async (
            req: FastifyRequest<{ Body: CreatePollRequest }>,
        ): Promise<CreatePollResponse> => {
            const { choices: pollChoices, pollName } = req.body;

            if (pollChoices.length < 2) {
                throw createError(400, 'Not enough choices.');
            }
            const existingPoll = await fastify.db.query.polls.findFirst({
                where: eq(polls.pollName, pollName),
                columns: {
                    id: true,
                },
            });

            if (existingPoll) {
                throw createError(400, 'Vote with that name already exists.');
            }

            const createdPoll = await fastify.db.transaction(async (tx) => {
                const [insertedPoll] = await tx
                    .insert(polls)
                    .values({ pollName })
                    .returning({
                        id: polls.id,
                        createdAt: polls.createdAt,
                    });

                await tx.insert(choices).values(
                    pollChoices.map((choiceName) => ({
                        choiceName,
                        pollId: insertedPoll.id,
                    })),
                );

                return insertedPoll;
            });

            return {
                pollName,
                choices: pollChoices,
                id: createdPoll.id,
                createdAt: createdPoll.createdAt,
            };
        },
    );
};

export default createPollRoute;
