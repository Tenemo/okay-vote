import Fastify, { FastifyInstance } from 'fastify';
import FastifyCors from '@fastify/cors';

import { createDatabaseClient } from 'db/connection';
import voteRoute from 'routes/vote';
import createPollRoute from 'routes/create-poll';
import pollRoute from 'routes/poll';

export const buildServer = async (): Promise<FastifyInstance> => {
    const fastify = Fastify({
        logger: {
            level: process.env.LOG_LEVEL ?? 'info',
        },
    });
    await fastify.register(FastifyCors, {
        origin: true,
    });
    const { db, pool } = createDatabaseClient();

    fastify.decorate('db', db);
    fastify.decorate('dbPool', pool);
    fastify.addHook('onClose', async () => {
        await pool.end();
    });
    await fastify.register(voteRoute, { prefix: '/api' });
    await fastify.register(createPollRoute, { prefix: '/api' });
    await fastify.register(pollRoute, { prefix: '/api' });
    return fastify;
};

export const start = async (): Promise<void> => {
    const fastify = await buildServer();

    try {
        await fastify.listen({
            host: '0.0.0.0',
            port: Number(process.env.PORT ?? 4000),
        });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

if (require.main === module) {
    void start();
}
