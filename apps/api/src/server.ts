import Fastify, { FastifyInstance } from 'fastify';
import FastifyPostgres from '@fastify/postgres';
import dotenv from 'dotenv';

import voteRoute from 'routes/vote';
import createPollRoute from 'routes/create-poll';
import pollRoute from 'routes/poll';

dotenv.config();

const TIMEOUT = 30 * 1000;

const getDatabaseSslConfig = (
    connectionString: string,
): false | { rejectUnauthorized: false } => {
    const databaseSsl = process.env.DATABASE_SSL?.toLowerCase();

    if (databaseSsl) {
        return ['1', 'true', 'require'].includes(databaseSsl)
            ? { rejectUnauthorized: false }
            : false;
    }

    try {
        const { hostname } = new URL(connectionString);

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return false;
        }
    } catch {
        return false;
    }

    return { rejectUnauthorized: false };
};

export const buildServer = async (): Promise<FastifyInstance> => {
    const fastify = Fastify({
        logger: {
            level: process.env.LOG_LEVEL ?? 'info',
        },
    });
    const connectionString =
        process.env.DATABASE_URL ??
        'postgres://postgres:postgres@localhost:5433/ov-db';

    await fastify.register(FastifyPostgres, {
        connectionString,
        ssl: getDatabaseSslConfig(connectionString),
        statement_timeout: TIMEOUT,
        query_timeout: TIMEOUT,
        idle_in_transaction_session_timeout: TIMEOUT,
        connectionTimeoutMillis: TIMEOUT,
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
