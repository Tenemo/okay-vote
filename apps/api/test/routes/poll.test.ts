import type { FastifyInstance } from 'fastify';
import { ERROR_MESSAGES } from '@okay-vote/contracts';
import {
    createPoll,
    fetchPoll,
    parseJson,
    submitVote,
    type CreatePollResponse,
    type MessageResponse,
    type PollResponse,
} from '@okay-vote/testkit';

import { createRouteTestApp, resetRouteTestApp } from 'test-support/test-app';

describe('poll route', () => {
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

    test('returns existing polls by slug and UUID and rejects missing refs', async () => {
        const createResponse = await createPoll(app, {
            pollName: 'movie night',
            choices: ['alien', 'arrival'],
        });
        const { id, slug } = parseJson<CreatePollResponse>(createResponse);

        const slugResponse = await fetchPoll(app, slug);
        expect(slugResponse.statusCode).toBe(200);
        const slugPayload = parseJson<PollResponse>(slugResponse);
        expect(slugPayload.id).toBe(id);
        expect(slugPayload.slug).toBe(slug);
        expect(slugPayload.pollName).toBe('movie night');
        expect(slugPayload.createdAt).toEqual(expect.any(String));
        expect(slugPayload.endedAt).toBeUndefined();
        expect(slugPayload.choices).toEqual(['alien', 'arrival']);
        expect(slugPayload.voters).toEqual([]);

        const uuidResponse = await fetchPoll(app, id);
        expect(uuidResponse.statusCode).toBe(200);
        expect(parseJson<PollResponse>(uuidResponse)).toMatchObject({
            id,
            slug,
            pollName: 'movie night',
        });

        const mismatchedSlugResponse = await fetchPoll(app, slug.toUpperCase());
        expect(mismatchedSlugResponse.statusCode).toBe(404);
        expect(
            parseJson<MessageResponse>(mismatchedSlugResponse),
        ).toMatchObject({
            message: ERROR_MESSAGES.pollNotFound,
        });

        const missingResponse = await fetchPoll(
            app,
            '123e4567-e89b-42d3-a456-426614174000',
        );
        expect(missingResponse.statusCode).toBe(404);
        expect(parseJson<MessageResponse>(missingResponse)).toMatchObject({
            message: ERROR_MESSAGES.pollNotFound,
        });
    });

    test('keeps results hidden while a poll is still open', async () => {
        const createResponse = await createPoll(app, {
            pollName: 'board games',
            choices: ['catan', 'azul'],
        });
        const { id, slug } = parseJson<CreatePollResponse>(createResponse);

        const voteResponse = await submitVote(app, id, {
            voterName: 'Ada',
            votes: {
                catan: 8,
                azul: 6,
            },
        });

        expect(voteResponse.statusCode).toBe(200);

        const pollResponse = await fetchPoll(app, slug);
        expect(pollResponse.statusCode).toBe(200);
        const payload = parseJson<PollResponse>(pollResponse);

        expect(payload.id).toBe(id);
        expect(payload.slug).toBe(slug);
        expect(payload.pollName).toBe('board games');
        expect(payload.createdAt).toEqual(expect.any(String));
        expect(payload.choices).toEqual(['catan', 'azul']);
        expect(payload.voters).toEqual(['Ada']);
        expect(payload.results).toBeUndefined();
    });

    test('keeps results hidden even after multiple voters submit while the poll is open', async () => {
        const createResponse = await createPoll(app, {
            pollName: 'weekend plan',
            choices: ['hiking', 'cinema'],
        });
        const { id, slug } = parseJson<CreatePollResponse>(createResponse);

        await submitVote(app, id, {
            voterName: 'Ada',
            votes: {
                hiking: 10,
                cinema: 4,
            },
        });
        await submitVote(app, id, {
            voterName: 'Grace',
            votes: {
                hiking: 8,
                cinema: 5,
            },
        });

        const pollResponse = await fetchPoll(app, slug);
        expect(pollResponse.statusCode).toBe(200);

        const payload = parseJson<PollResponse>(pollResponse);

        expect(payload.id).toBe(id);
        expect(payload.slug).toBe(slug);
        expect(payload.voters).toEqual(
            expect.arrayContaining(['Ada', 'Grace']),
        );
        expect(payload.choices).toEqual(['hiking', 'cinema']);
        expect(payload.endedAt).toBeUndefined();
        expect(payload.results).toBeUndefined();
    });
});
