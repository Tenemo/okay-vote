import type { FastifyInstance } from 'fastify';
import { ERROR_MESSAGES } from '@okay-vote/contracts';
import {
    createPoll,
    parseJson,
    type CreatePollResponse,
    type MessageResponse,
} from '@okay-vote/testkit';

import { polls } from 'db/schema';
import { createRouteTestApp, resetRouteTestApp } from 'test-support/test-app';

describe('create poll route', () => {
    let app: FastifyInstance;
    let pollIdUtils: typeof import('utils/poll-id');
    let slugUtils: typeof import('utils/slug');

    beforeAll(async () => {
        app = await createRouteTestApp();
        pollIdUtils = await import('utils/poll-id');
        slugUtils = await import('utils/slug');
    });

    beforeEach(async () => {
        await resetRouteTestApp(app);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    afterAll(async () => {
        await app.close();
    });

    test('creates a poll and keeps the response shape stable', async () => {
        const response = await createPoll(app, {
            pollName: 'team lunch',
            choices: ['pizza', 'ramen'],
        });

        expect(response.statusCode).toBe(200);

        const payload = parseJson<CreatePollResponse>(response);
        expect(payload.pollName).toBe('team lunch');
        expect(payload.choices).toEqual(['pizza', 'ramen']);
        expect(payload.id).toEqual(expect.any(String));
        expect(payload.slug).toEqual(expect.any(String));
        expect(payload.createdAt).toEqual(expect.any(String));
        expect(payload.organizerToken).toMatch(/^[0-9a-f]{64}$/);
        expect(new Date(payload.createdAt).toString()).not.toBe('Invalid Date');
    });

    test('rejects invalid create input and duplicate trimmed choice names', async () => {
        const notEnoughChoices = await createPoll(app, {
            pollName: 'invalid',
            choices: ['only one'],
        });

        expect(notEnoughChoices.statusCode).toBe(400);
        expect(parseJson<MessageResponse>(notEnoughChoices)).toMatchObject({
            message: ERROR_MESSAGES.notEnoughChoices,
        });

        const duplicateChoiceNames = await createPoll(app, {
            pollName: 'duplicate choices',
            choices: ['pizza', 'pizza'],
        });

        expect(duplicateChoiceNames.statusCode).toBe(400);
        expect(parseJson<MessageResponse>(duplicateChoiceNames)).toMatchObject({
            message: ERROR_MESSAGES.duplicateChoiceNames,
        });

        const duplicateTrimmedChoiceNames = await createPoll(app, {
            pollName: 'duplicate trimmed choices',
            choices: ['pizza', ' pizza '],
        });

        expect(duplicateTrimmedChoiceNames.statusCode).toBe(400);
        expect(
            parseJson<MessageResponse>(duplicateTrimmedChoiceNames),
        ).toMatchObject({
            message: ERROR_MESSAGES.duplicateChoiceNames,
        });
    });

    test('allows duplicate poll names and escalates slug suffixes on collision', async () => {
        vi.spyOn(pollIdUtils.pollIdGenerator, 'generate')
            .mockReturnValueOnce('11111111-1111-4111-8111-1111aaaabbbb')
            .mockReturnValueOnce('22222222-2222-4222-8222-2222aaaabbbb');

        const firstResponse = await createPoll(app, {
            pollName: 'retro',
            choices: ['yes', 'no'],
        });
        const secondResponse = await createPoll(app, {
            pollName: 'retro',
            choices: ['one', 'two'],
        });

        expect(firstResponse.statusCode).toBe(200);
        expect(secondResponse.statusCode).toBe(200);

        const firstPayload = parseJson<CreatePollResponse>(firstResponse);
        const secondPayload = parseJson<CreatePollResponse>(secondResponse);

        expect(firstPayload.pollName).toBe('retro');
        expect(secondPayload.pollName).toBe('retro');
        expect(firstPayload.id).not.toBe(secondPayload.id);
        expect(firstPayload.slug).toBe('retro--aaaabbbb');
        expect(secondPayload.slug).toBe('retro--2222aaaabbbb');
    });

    test('returns a clear 500 when every generated slug candidate collides', async () => {
        const pollId = '12345678-1234-4234-8234-123456789abc';
        const pollName = 'retro';
        const slugCandidates = slugUtils.getPollSlugCandidates(
            pollName,
            pollId,
        );

        await app.db.insert(polls).values(
            slugCandidates.map((slug, index) => ({
                id: `00000000-0000-4000-8000-00000000000${index + 1}`,
                pollName: `existing-${index + 1}`,
                slug,
            })),
        );

        vi.spyOn(pollIdUtils.pollIdGenerator, 'generate').mockReturnValue(
            pollId,
        );

        const response = await createPoll(app, {
            pollName,
            choices: ['yes', 'no'],
        });

        expect(response.statusCode).toBe(500);
        expect(parseJson<MessageResponse>(response)).toMatchObject({
            message: ERROR_MESSAGES.pollSlugGenerationFailed,
        });
    });
});
