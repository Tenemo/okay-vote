import type { FastifyInstance } from 'fastify';
import createError from 'http-errors';
import {
    ERROR_MESSAGES,
    MessageResponseSchema,
    PollResponse,
    PollResponseSchema,
} from '@okay-vote/contracts';

import { buildPollResponse } from 'domain/polls/fetch';
import { findPollDetailsByRef } from 'domain/polls/queries';

const schema = {
    response: {
        200: PollResponseSchema,
        404: MessageResponseSchema,
    },
};

const pollRoute = async (fastify: FastifyInstance): Promise<void> => {
    fastify.get<{ Params: { pollRef: string } }>(
        '/polls/:pollRef',
        { schema },
        async (req): Promise<PollResponse> => {
            const { pollRef } = req.params;
            const poll = await findPollDetailsByRef(fastify.db, pollRef);

            if (!poll) {
                throw createError(404, ERROR_MESSAGES.pollNotFound);
            }

            return buildPollResponse(poll);
        },
    );
};

export default pollRoute;
