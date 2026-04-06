import type { FastifyInstance } from 'fastify';

import { fetchHealthCheck } from '@okay-vote/testkit';

import { createRouteTestApp, resetRouteTestApp } from 'test-support/test-app';

describe('CORS configuration', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = await createRouteTestApp();
    });

    beforeEach(async () => {
        await resetRouteTestApp(app);
    });

    afterAll(async () => {
        await app.close();
    });

    test('allows configured and local cors origins and blocks unknown origins', async () => {
        const configuredOrigin = await fetchHealthCheck(app, {
            origin: 'https://app.okay.vote',
        });

        expect(configuredOrigin.statusCode).toBe(200);
        expect(configuredOrigin.headers['access-control-allow-origin']).toBe(
            'https://app.okay.vote',
        );

        const localhostOrigin = await fetchHealthCheck(app, {
            origin: 'http://localhost:3000',
        });

        expect(localhostOrigin.statusCode).toBe(200);
        expect(localhostOrigin.headers['access-control-allow-origin']).toBe(
            'http://localhost:3000',
        );

        const unknownOrigin = await fetchHealthCheck(app, {
            origin: 'https://evil.example',
        });

        expect(unknownOrigin.statusCode).toBe(200);
        expect(
            unknownOrigin.headers['access-control-allow-origin'],
        ).toBeUndefined();
    });
});
