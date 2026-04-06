import Fastify, { FastifyInstance } from 'fastify';
import FastifyCors from '@fastify/cors';
import { API_PREFIX } from '@okay-vote/contracts';

import { config, isAllowedCorsOrigin } from 'config';
import { createDatabaseClient } from 'db/connection';
import voteRoute from 'routes/vote';
import createPollRoute from 'routes/create-poll';
import healthCheckRoute from 'routes/health-check';
import pollRoute from 'routes/poll';

export const buildServer = async (): Promise<FastifyInstance> => {
    const fastify = Fastify({
        logger: {
            level: config.logLevel,
        },
    });
    await fastify.register(FastifyCors, {
        origin: (origin, callback) => {
            callback(null, isAllowedCorsOrigin(origin));
        },
        methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
    });
    const { db, pool } = createDatabaseClient();

    fastify.decorate('db', db);
    fastify.decorate('dbPool', pool);
    fastify.addHook('onClose', async () => {
        await pool.end();
    });
    await fastify.register(healthCheckRoute, { prefix: API_PREFIX });
    await fastify.register(voteRoute, { prefix: API_PREFIX });
    await fastify.register(createPollRoute, { prefix: API_PREFIX });
    await fastify.register(pollRoute, { prefix: API_PREFIX });
    return fastify;
};

export const start = async (): Promise<void> => {
    const fastify = await buildServer();

    try {
        await fastify.listen({
            host: config.host,
            port: config.port,
        });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

if (require.main === module) {
    void start();
}
