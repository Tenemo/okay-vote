import type { FastifyInstance } from 'fastify';

const DEFAULT_DATABASE_URL =
    'postgres://postgres:postgres@localhost:5433/ov-db';

export const createRouteTestApp = async (): Promise<FastifyInstance> => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
    process.env.CORS_ALLOWED_ORIGINS = 'https://app.okay.vote';

    vi.resetModules();

    const { buildServer } = await import('server');
    const app = await buildServer();
    await app.ready();

    return app;
};

export const resetRouteTestApp = async (
    app: FastifyInstance,
): Promise<void> => {
    const { resetDatabase } = await import('db/migrations');

    await resetDatabase(app.dbPool, app.db);
};
