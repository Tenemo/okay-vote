import type { FastifyInstance } from 'fastify';
import { ERROR_MESSAGES } from '@okay-vote/contracts';
import {
    createPoll,
    parseJson,
    submitVote,
    type CreatePollResponse,
    type MessageResponse,
} from '@okay-vote/testkit';

import { createRouteTestApp, resetRouteTestApp } from 'test-support/test-app';

describe('vote route', () => {
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

    test('rejects invalid, empty, and duplicate vote submissions', async () => {
        const createResponse = await createPoll(app, {
            pollName: 'lunch spot',
            choices: ['ramen', 'pizza'],
        });
        const { id, slug } = parseJson<CreatePollResponse>(createResponse);

        const invalidPollId = await submitVote(app, 'not-a-uuid', {
            voterName: 'Ada',
            votes: {},
        });
        expect(invalidPollId.statusCode).toBe(400);
        expect(parseJson<MessageResponse>(invalidPollId)).toMatchObject({
            message: ERROR_MESSAGES.invalidPollId,
        });

        const emptyVotesResponse = await submitVote(app, id, {
            voterName: 'Ada',
            votes: {},
        });
        expect(emptyVotesResponse.statusCode).toBe(400);
        expect(parseJson<MessageResponse>(emptyVotesResponse)).toMatchObject({
            message: ERROR_MESSAGES.emptyVoteSubmission,
        });

        const slugVoteResponse = await submitVote(app, slug, {
            voterName: 'Ada',
            votes: {
                ramen: 8,
            },
        });
        expect(slugVoteResponse.statusCode).toBe(400);
        expect(parseJson<MessageResponse>(slugVoteResponse)).toMatchObject({
            message: ERROR_MESSAGES.invalidPollId,
        });

        const invalidVotesResponse = await submitVote(app, id, {
            voterName: 'Grace',
            votes: {
                sushi: 8,
            },
        });
        expect(invalidVotesResponse.statusCode).toBe(400);
        expect(parseJson<MessageResponse>(invalidVotesResponse)).toMatchObject({
            message: ERROR_MESSAGES.noValidVotes,
        });

        const outOfRangeVotesResponse = await submitVote(app, id, {
            voterName: 'Linus',
            votes: {
                ramen: 11,
            },
        });
        expect(outOfRangeVotesResponse.statusCode).toBe(400);
        expect(
            parseJson<MessageResponse>(outOfRangeVotesResponse).message,
        ).toEqual(expect.any(String));

        const fractionalVotesResponse = await submitVote(app, id, {
            voterName: 'Margo',
            votes: {
                pizza: 7.5,
            },
        });
        expect(fractionalVotesResponse.statusCode).toBe(400);
        expect(
            parseJson<MessageResponse>(fractionalVotesResponse).message,
        ).toEqual(expect.any(String));

        const firstVote = await submitVote(app, id, {
            voterName: 'Ada',
            votes: {
                ramen: 7,
            },
        });
        expect(firstVote.statusCode).toBe(200);

        const duplicateVote = await submitVote(app, id, {
            voterName: 'Ada',
            votes: {
                ramen: 8,
            },
        });
        expect(duplicateVote.statusCode).toBe(409);
        expect(parseJson<MessageResponse>(duplicateVote)).toMatchObject({
            message: ERROR_MESSAGES.duplicateVoteSubmission,
        });
    });
});
