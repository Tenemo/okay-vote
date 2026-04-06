import { FastifyInstance } from 'fastify';
import {
    HealthCheckResponse,
    HealthCheckResponseSchema,
} from '@okay-vote/contracts';

import { polls } from 'db/schema';

const schema = {
    response: {
        200: HealthCheckResponseSchema,
        503: HealthCheckResponseSchema,
    },
};

const healthCheckRoute = async (fastify: FastifyInstance): Promise<void> => {
    fastify.get(
        '/health-check',
        { schema },
        async (_request, reply): Promise<HealthCheckResponse> => {
            try {
                await fastify.db.select({ id: polls.id }).from(polls).limit(1);

                return {
                    service: 'OK',
                    database: 'OK',
                };
            } catch {
                void reply.code(503);

                return {
                    service: 'OK',
                    database: 'Failed',
                };
            }
        },
    );
};

export default healthCheckRoute;
