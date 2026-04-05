import { FastifyInstance, FastifyRequest } from 'fastify';
import sql from '@nearform/sql';
import createError from 'http-errors';
import {
    CreatePollRequest,
    CreatePollRequestSchema,
    CreatePollResponse,
    CreatePollResponseSchema,
} from '@okay-vote/contracts';

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
            const { choices, pollName } = req.body;

            if (choices.length < 2) {
                throw createError(400, 'Not enough choices.');
            }
            const sqlFindExisting = sql`
                SELECT id
                FROM polls
                WHERE poll_name = ${pollName}`;
            const { rows: polls } = await fastify.pg.query(sqlFindExisting);
            if (polls.length) {
                throw createError(400, 'Vote with that name already exists.');
            }

            const sqlInsertPoll = sql`
                INSERT into polls (poll_name)
                VALUES (${pollName})
                RETURNING *
                `;
            const { rows: createdPolls } = await fastify.pg.query<{
                id: string;
                created_at: string;
            }>(sqlInsertPoll);
            const { id, created_at: createdAt } = createdPolls[0];

            const sqlInsertChoices = sql`
                INSERT into choices (choice_name, poll_id)
                VALUES ${sql.glue(
                    choices.map((choice) => sql`(${choice},${id})`),
                    ',',
                )}`;
            await fastify.pg.query(sqlInsertChoices);

            return {
                pollName,
                choices,
                id,
                createdAt,
            };
        },
    );
};

export default createPollRoute;
