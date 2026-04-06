import type { FastifyInstance } from 'fastify';
import {
    ERROR_MESSAGES,
    POLL_ROUTES,
    type CreatePollResponse,
    type HealthCheckResponse,
    type MessageResponse,
    type PollResponse,
} from '@okay-vote/contracts';

type TestResponse = {
    body: string;
    headers: Record<string, string | string[] | undefined>;
    statusCode: number;
};

const normalizeResponse = (response: unknown): TestResponse => {
    const { body, headers, statusCode } = response as {
        body: string;
        headers: Record<string, string | string[] | undefined>;
        statusCode: number;
    };

    return {
        body,
        headers,
        statusCode,
    };
};

const parseJson = <T>(response: TestResponse): T =>
    JSON.parse(response.body) as T;

describe('poll routes', () => {
    let app: FastifyInstance;
    let buildServer: () => Promise<FastifyInstance>;
    let resetDatabase: (
        pool: FastifyInstance['dbPool'],
        db: FastifyInstance['db'],
    ) => Promise<void>;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        process.env.DATABASE_URL =
            process.env.DATABASE_URL ??
            'postgres://postgres:postgres@localhost:5433/ov-db';
        process.env.CORS_ALLOWED_ORIGINS = 'https://app.okay.vote';

        vi.resetModules();
        ({ resetDatabase } = await import('../../src/db/migrations'));
        ({ buildServer } = await import('../../src/server'));
        app = await buildServer();
        await app.ready();
    });

    beforeEach(async () => {
        await resetDatabase(app.dbPool, app.db);
    });

    afterAll(async () => {
        await app.close();
    });

    const createPoll = async ({
        choices,
        pollName,
    }: {
        choices: string[];
        pollName: string;
    }): Promise<TestResponse> =>
        normalizeResponse(
            await app.inject({
                method: 'POST',
                url: POLL_ROUTES.create,
                payload: {
                    choices,
                    pollName,
                },
            }),
        );

    const vote = async (
        pollId: string,
        body: { votes: Record<string, number>; voterName: string },
    ): Promise<TestResponse> =>
        normalizeResponse(
            await app.inject({
                method: 'POST',
                url: POLL_ROUTES.vote(pollId),
                payload: body,
            }),
        );

    const getPoll = async (pollId: string): Promise<TestResponse> =>
        normalizeResponse(
            await app.inject({
                method: 'GET',
                url: POLL_ROUTES.poll(pollId),
            }),
        );

    test('creates a poll and keeps the response shape stable', async () => {
        const response = await createPoll({
            pollName: 'team lunch',
            choices: ['pizza', 'ramen'],
        });

        expect(response.statusCode).toBe(200);

        const payload = parseJson<CreatePollResponse>(response);
        expect(payload.pollName).toBe('team lunch');
        expect(payload.choices).toEqual(['pizza', 'ramen']);
        expect(payload.id).toEqual(expect.any(String));
        expect(payload.createdAt).toEqual(expect.any(String));
        expect(new Date(payload.createdAt).toString()).not.toBe('Invalid Date');
    });

    test('rejects invalid create input and duplicate trimmed choice names', async () => {
        const notEnoughChoices = await createPoll({
            pollName: 'invalid',
            choices: ['only one'],
        });

        expect(notEnoughChoices.statusCode).toBe(400);
        expect(parseJson<MessageResponse>(notEnoughChoices)).toMatchObject({
            message: ERROR_MESSAGES.notEnoughChoices,
        });

        const duplicateChoiceNames = await createPoll({
            pollName: 'duplicate choices',
            choices: ['pizza', 'pizza'],
        });

        expect(duplicateChoiceNames.statusCode).toBe(400);
        expect(parseJson<MessageResponse>(duplicateChoiceNames)).toMatchObject({
            message: ERROR_MESSAGES.duplicateChoiceNames,
        });

        const duplicateTrimmedChoiceNames = await createPoll({
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

    test('allows duplicate poll names because poll IDs are the unique identifier', async () => {
        const firstResponse = await createPoll({
            pollName: 'retro',
            choices: ['yes', 'no'],
        });
        const secondResponse = await createPoll({
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
    });

    test('returns existing polls and rejects invalid or missing polls', async () => {
        const createResponse = await createPoll({
            pollName: 'movie night',
            choices: ['alien', 'arrival'],
        });
        const { id } = parseJson<CreatePollResponse>(createResponse);

        const pollResponse = await getPoll(id);
        expect(pollResponse.statusCode).toBe(200);
        const pollPayload = parseJson<PollResponse>(pollResponse);
        expect(pollPayload.pollName).toBe('movie night');
        expect(pollPayload.createdAt).toEqual(expect.any(String));
        expect(pollPayload.choices).toEqual(['alien', 'arrival']);
        expect(pollPayload.voters).toEqual([]);

        const invalidResponse = await getPoll('not-a-uuid');
        expect(invalidResponse.statusCode).toBe(400);
        expect(parseJson<MessageResponse>(invalidResponse)).toMatchObject({
            message: ERROR_MESSAGES.invalidPollId,
        });

        const missingResponse = await getPoll(
            '123e4567-e89b-42d3-a456-426614174000',
        );
        expect(missingResponse.statusCode).toBe(404);
        expect(parseJson<MessageResponse>(missingResponse)).toMatchObject({
            message: ERROR_MESSAGES.pollNotFound,
        });
    });

    test('keeps results hidden until at least two voters submit', async () => {
        const createResponse = await createPoll({
            pollName: 'board games',
            choices: ['catan', 'azul'],
        });
        const { id } = parseJson<CreatePollResponse>(createResponse);

        const voteResponse = await vote(id, {
            voterName: 'Ada',
            votes: {
                catan: 8,
                azul: 6,
            },
        });

        expect(voteResponse.statusCode).toBe(200);

        const pollResponse = await getPoll(id);
        expect(pollResponse.statusCode).toBe(200);
        const payload = parseJson<PollResponse>(pollResponse);

        expect(payload.pollName).toBe('board games');
        expect(payload.createdAt).toEqual(expect.any(String));
        expect(payload.choices).toEqual(['catan', 'azul']);
        expect(payload.voters).toEqual(['Ada']);
    });

    test('returns numeric aggregate results after two votes', async () => {
        const createResponse = await createPoll({
            pollName: 'weekend plan',
            choices: ['hiking', 'cinema'],
        });
        const { id } = parseJson<CreatePollResponse>(createResponse);

        await vote(id, {
            voterName: 'Ada',
            votes: {
                hiking: 10,
                cinema: 4,
            },
        });
        await vote(id, {
            voterName: 'Grace',
            votes: {
                hiking: 8,
                cinema: 5,
            },
        });

        const pollResponse = await getPoll(id);
        expect(pollResponse.statusCode).toBe(200);

        const payload = parseJson<PollResponse>(pollResponse);

        expect(payload.voters).toEqual(
            expect.arrayContaining(['Ada', 'Grace']),
        );
        expect(payload.choices).toEqual(['hiking', 'cinema']);
        expect(payload.results).toBeDefined();

        if (!payload.results) {
            throw new Error('Expected aggregated results after two votes.');
        }

        expect(payload.results.hiking).toBeCloseTo(8.94, 2);
        expect(payload.results.cinema).toBeCloseTo(4.47, 2);
    });

    test('rejects invalid, empty, and duplicate vote submissions', async () => {
        const createResponse = await createPoll({
            pollName: 'lunch spot',
            choices: ['ramen', 'pizza'],
        });
        const { id } = parseJson<CreatePollResponse>(createResponse);

        const invalidPollId = await vote('not-a-uuid', {
            voterName: 'Ada',
            votes: {},
        });
        expect(invalidPollId.statusCode).toBe(400);
        expect(parseJson<MessageResponse>(invalidPollId)).toMatchObject({
            message: ERROR_MESSAGES.invalidPollId,
        });

        const emptyVotesResponse = await vote(id, {
            voterName: 'Ada',
            votes: {},
        });
        expect(emptyVotesResponse.statusCode).toBe(400);
        expect(parseJson<MessageResponse>(emptyVotesResponse)).toMatchObject({
            message: ERROR_MESSAGES.emptyVoteSubmission,
        });

        const invalidVotesResponse = await vote(id, {
            voterName: 'Grace',
            votes: {
                sushi: 8,
            },
        });
        expect(invalidVotesResponse.statusCode).toBe(400);
        expect(parseJson<MessageResponse>(invalidVotesResponse)).toMatchObject({
            message: ERROR_MESSAGES.noValidVotes,
        });

        const outOfRangeVotesResponse = await vote(id, {
            voterName: 'Linus',
            votes: {
                ramen: 11,
            },
        });
        expect(outOfRangeVotesResponse.statusCode).toBe(400);
        expect(
            parseJson<MessageResponse>(outOfRangeVotesResponse).message,
        ).toEqual(expect.any(String));

        const fractionalVotesResponse = await vote(id, {
            voterName: 'Margo',
            votes: {
                pizza: 7.5,
            },
        });
        expect(fractionalVotesResponse.statusCode).toBe(400);
        expect(
            parseJson<MessageResponse>(fractionalVotesResponse).message,
        ).toEqual(expect.any(String));

        const firstVote = await vote(id, {
            voterName: 'Ada',
            votes: {
                ramen: 7,
            },
        });
        expect(firstVote.statusCode).toBe(200);

        const duplicateVote = await vote(id, {
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

    test('reports service and database health', async () => {
        const response = normalizeResponse(
            await app.inject({
                method: 'GET',
                url: POLL_ROUTES.healthCheck,
            }),
        );

        expect(response.statusCode).toBe(200);
        expect(parseJson<HealthCheckResponse>(response)).toEqual({
            service: 'OK',
            database: 'OK',
        });
    });

    test('allows configured and local cors origins and blocks unknown origins', async () => {
        const configuredOrigin = normalizeResponse(
            await app.inject({
                method: 'GET',
                url: POLL_ROUTES.healthCheck,
                headers: {
                    origin: 'https://app.okay.vote',
                },
            }),
        );

        expect(configuredOrigin.statusCode).toBe(200);
        expect(configuredOrigin.headers['access-control-allow-origin']).toBe(
            'https://app.okay.vote',
        );

        const localhostOrigin = normalizeResponse(
            await app.inject({
                method: 'GET',
                url: POLL_ROUTES.healthCheck,
                headers: {
                    origin: 'http://localhost:3000',
                },
            }),
        );

        expect(localhostOrigin.statusCode).toBe(200);
        expect(localhostOrigin.headers['access-control-allow-origin']).toBe(
            'http://localhost:3000',
        );

        const unknownOrigin = normalizeResponse(
            await app.inject({
                method: 'GET',
                url: POLL_ROUTES.healthCheck,
                headers: {
                    origin: 'https://evil.example',
                },
            }),
        );

        expect(unknownOrigin.statusCode).toBe(200);
        expect(
            unknownOrigin.headers['access-control-allow-origin'],
        ).toBeUndefined();
    });
});
