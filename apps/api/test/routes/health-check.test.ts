import type { FastifyInstance } from 'fastify';
import {
    fetchHealthCheck,
    parseJson,
    type HealthCheckResponse,
} from '@okay-vote/testkit';

import { createRouteTestApp, resetRouteTestApp } from '../support/test-app';

describe('health check route', () => {
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

    test('reports service and database health', async () => {
        const response = await fetchHealthCheck(app);

        expect(response.statusCode).toBe(200);
        expect(parseJson<HealthCheckResponse>(response)).toEqual({
            service: 'OK',
            database: 'OK',
        });
    });
});
