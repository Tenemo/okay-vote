import type { FastifyInstance } from 'fastify';
import { ERROR_MESSAGES } from '@okay-vote/contracts';
import {
    createPoll,
    endPoll,
    parseJson,
    submitVote,
    type CreatePollResponse,
    type MessageResponse,
    type PollResponse,
} from '@okay-vote/testkit';

import { createRouteTestApp, resetRouteTestApp } from 'test-support/test-app';

describe('end poll route', () => {
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

    test('rejects missing and invalid organizer tokens', async () => {
        const createResponse = await createPoll(app, {
            pollName: 'lunch',
            choices: ['pizza', 'ramen'],
        });
        const { id } = parseJson<CreatePollResponse>(createResponse);

        const missingTokenResponse = await endPoll(app, id, {
            organizerToken: '   ',
        });
        expect(missingTokenResponse.statusCode).toBe(400);
        expect(parseJson<MessageResponse>(missingTokenResponse)).toMatchObject({
            message: ERROR_MESSAGES.organizerTokenRequired,
        });

        const invalidTokenResponse = await endPoll(app, id, {
            organizerToken: 'not-the-real-token',
        });
        expect(invalidTokenResponse.statusCode).toBe(403);
        expect(parseJson<MessageResponse>(invalidTokenResponse)).toMatchObject({
            message: ERROR_MESSAGES.organizerUnauthorizedToEndPoll,
        });
    });

    test('ends a poll idempotently for the organizer and returns final results', async () => {
        const createResponse = await createPoll(app, {
            pollName: 'weekend plan',
            choices: ['hiking', 'cinema'],
        });
        const { id, organizerToken } =
            parseJson<CreatePollResponse>(createResponse);

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

        const firstEndResponse = await endPoll(app, id, {
            organizerToken,
        });
        expect(firstEndResponse.statusCode).toBe(200);

        const firstPayload = parseJson<PollResponse>(firstEndResponse);
        expect(firstPayload.endedAt).toEqual(expect.any(String));
        expect(firstPayload.results).toBeDefined();

        if (!firstPayload.results || !firstPayload.endedAt) {
            throw new Error('Expected ended poll results and timestamp.');
        }

        expect(firstPayload.results.hiking).toBeCloseTo(8.94, 2);
        expect(firstPayload.results.cinema).toBeCloseTo(4.47, 2);

        const secondEndResponse = await endPoll(app, id, {
            organizerToken,
        });
        expect(secondEndResponse.statusCode).toBe(200);

        const secondPayload = parseJson<PollResponse>(secondEndResponse);
        expect(secondPayload.endedAt).toBe(firstPayload.endedAt);
        expect(secondPayload.results).toEqual(firstPayload.results);
    });

    test('keeps the stored end timestamp stable under concurrent organizer requests', async () => {
        const createResponse = await createPoll(app, {
            pollName: 'concurrent end',
            choices: ['alpha', 'beta'],
        });
        const { id, organizerToken } =
            parseJson<CreatePollResponse>(createResponse);

        await submitVote(app, id, {
            voterName: 'Ada',
            votes: {
                alpha: 7,
            },
        });
        await submitVote(app, id, {
            voterName: 'Grace',
            votes: {
                beta: 8,
            },
        });

        const [firstEndResponse, secondEndResponse] = await Promise.all([
            endPoll(app, id, {
                organizerToken,
            }),
            endPoll(app, id, {
                organizerToken,
            }),
        ]);

        expect(firstEndResponse.statusCode).toBe(200);
        expect(secondEndResponse.statusCode).toBe(200);

        const firstPayload = parseJson<PollResponse>(firstEndResponse);
        const secondPayload = parseJson<PollResponse>(secondEndResponse);

        expect(firstPayload.endedAt).toEqual(expect.any(String));
        expect(secondPayload.endedAt).toBe(firstPayload.endedAt);
    });

    test('rejects ending an open poll before two distinct people have voted', async () => {
        const createResponse = await createPoll(app, {
            pollName: 'single voter',
            choices: ['apples', 'bananas'],
        });
        const { id, organizerToken } =
            parseJson<CreatePollResponse>(createResponse);

        const zeroVoteEndResponse = await endPoll(app, id, {
            organizerToken,
        });
        expect(zeroVoteEndResponse.statusCode).toBe(409);
        expect(parseJson<MessageResponse>(zeroVoteEndResponse)).toMatchObject({
            message: ERROR_MESSAGES.notEnoughVotersToEndPoll,
        });

        await submitVote(app, id, {
            voterName: 'Ada',
            votes: {
                apples: 7,
                bananas: 3,
            },
        });

        const oneVoteEndResponse = await endPoll(app, id, {
            organizerToken,
        });
        expect(oneVoteEndResponse.statusCode).toBe(409);
        expect(parseJson<MessageResponse>(oneVoteEndResponse)).toMatchObject({
            message: ERROR_MESSAGES.notEnoughVotersToEndPoll,
        });
    });

    test('returns results when exactly two people have voted before the organizer ends the poll', async () => {
        const createResponse = await createPoll(app, {
            pollName: 'pair vote',
            choices: ['apples', 'bananas'],
        });
        const { id, organizerToken } =
            parseJson<CreatePollResponse>(createResponse);

        await submitVote(app, id, {
            voterName: 'Ada',
            votes: {
                apples: 7,
                bananas: 3,
            },
        });
        await submitVote(app, id, {
            voterName: 'Grace',
            votes: {
                apples: 8,
                bananas: 5,
            },
        });

        const endResponse = await endPoll(app, id, {
            organizerToken,
        });
        expect(endResponse.statusCode).toBe(200);

        expect(parseJson<PollResponse>(endResponse)).toMatchObject({
            voters: ['Ada', 'Grace'],
            results: {
                apples: 7.48,
                bananas: 3.87,
            },
        });
    });
});
