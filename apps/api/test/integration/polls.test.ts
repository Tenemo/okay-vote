import fs from 'fs';
import path from 'path';

import type { FastifyInstance } from 'fastify';
import type { CreatePollResponse, PollResponse } from '@okay-vote/contracts';

import { buildServer } from '../../src/server';

const dropSql = fs.readFileSync(
    path.resolve(__dirname, '../../src/sql/drop.sql'),
    'utf8',
);
const createSql = fs.readFileSync(
    path.resolve(__dirname, '../../src/sql/create.sql'),
    'utf8',
);

type TestResponse = {
    statusCode: number;
    body: string;
};

const normalizeResponse = (response: unknown): TestResponse => {
    const { statusCode, body } = response as {
        statusCode: number;
        body: string;
    };

    return {
        statusCode,
        body,
    };
};

const createPoll = async (
    app: FastifyInstance,
    body: { choices: string[]; pollName: string },
): Promise<TestResponse> =>
    normalizeResponse(
        await app.inject({
            method: 'POST',
            url: '/api/polls/create',
            payload: body,
        }),
    );

const vote = async (
    app: FastifyInstance,
    pollId: string,
    body: { votes: Record<string, number>; voterName: string },
): Promise<TestResponse> =>
    normalizeResponse(
        await app.inject({
            method: 'POST',
            url: `/api/polls/${pollId}/vote`,
            payload: body,
        }),
    );

const getPoll = async (
    app: FastifyInstance,
    pollId: string,
): Promise<TestResponse> =>
    normalizeResponse(
        await app.inject({
            method: 'GET',
            url: `/api/polls/${pollId}`,
        }),
    );

const parseJson = <T>(response: TestResponse): T =>
    JSON.parse(response.body) as T;

type ErrorResponse = {
    message: string;
};

describe('poll routes', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        process.env.DATABASE_URL =
            process.env.DATABASE_URL ??
            'postgres://postgres:postgres@localhost:5433/ov-db';
        process.env.DATABASE_SSL = process.env.DATABASE_SSL ?? 'false';

        app = await buildServer();
        await app.ready();
    });

    beforeEach(async () => {
        await app.pg.query(dropSql);
        await app.pg.query(createSql);
    });

    afterAll(async () => {
        await app.pg.query(dropSql);
        await app.close();
    });

    it('creates a poll and does not expose removed fields', async () => {
        const response = await createPoll(app, {
            pollName: 'team lunch',
            choices: ['pizza', 'ramen'],
        });

        expect(response.statusCode).toBe(200);

        const payload = parseJson<CreatePollResponse>(response);
        expect(payload.pollName).toBe('team lunch');
        expect(payload.choices).toEqual(['pizza', 'ramen']);
        expect(payload.id).toEqual(expect.any(String));
        expect(payload.createdAt).toEqual(expect.any(String));
        expect(payload).not.toHaveProperty('creatorToken');
        expect(payload).not.toHaveProperty('maxParticipants');
        expect(new Date(payload.createdAt).toString()).not.toBe('Invalid Date');
    });

    it('rejects duplicate poll names and too few choices', async () => {
        await createPoll(app, {
            pollName: 'retro',
            choices: ['yes', 'no'],
        });

        const duplicateResponse = await createPoll(app, {
            pollName: 'retro',
            choices: ['one', 'two'],
        });
        expect(duplicateResponse.statusCode).toBe(400);
        expect(parseJson<ErrorResponse>(duplicateResponse)).toMatchObject({
            message: 'Vote with that name already exists.',
        });

        const invalidResponse = await createPoll(app, {
            pollName: 'invalid',
            choices: ['only one'],
        });
        expect(invalidResponse.statusCode).toBe(400);
        expect(parseJson<ErrorResponse>(invalidResponse)).toMatchObject({
            message: 'Not enough choices.',
        });
    });

    it('returns existing polls and rejects missing polls', async () => {
        const createResponse = await createPoll(app, {
            pollName: 'movie night',
            choices: ['alien', 'arrival'],
        });
        const { id } = parseJson<CreatePollResponse>(createResponse);

        const pollResponse = await getPoll(app, id);
        expect(pollResponse.statusCode).toBe(200);
        const pollPayload = parseJson<PollResponse>(pollResponse);
        expect(pollPayload.pollName).toBe('movie night');
        expect(pollPayload.createdAt).toEqual(expect.any(String));
        expect(pollPayload.choices).toEqual(['alien', 'arrival']);
        expect(pollPayload.voters).toEqual([]);

        const missingResponse = await getPoll(
            app,
            '00000000-0000-0000-0000-000000000000',
        );
        expect(missingResponse.statusCode).toBe(400);
        expect(parseJson<ErrorResponse>(missingResponse)).toMatchObject({
            message:
                'Vote with ID 00000000-0000-0000-0000-000000000000 does not exist.',
        });
    });

    it('keeps results hidden until at least two voters submit', async () => {
        const createResponse = await createPoll(app, {
            pollName: 'board games',
            choices: ['catan', 'azul'],
        });
        const { id } = parseJson<CreatePollResponse>(createResponse);

        const voteResponse = await vote(app, id, {
            voterName: 'Ada',
            votes: {
                catan: 8,
                azul: 6,
            },
        });
        expect(voteResponse.statusCode).toBe(200);

        const pollResponse = await getPoll(app, id);
        expect(pollResponse.statusCode).toBe(200);
        const pollPayload = parseJson<PollResponse>(pollResponse);
        expect(pollPayload.pollName).toBe('board games');
        expect(pollPayload.createdAt).toEqual(expect.any(String));
        expect(pollPayload.choices).toEqual(['catan', 'azul']);
        expect(pollPayload.voters).toEqual(['Ada']);
    });

    it('returns numeric aggregate results after two votes', async () => {
        const createResponse = await createPoll(app, {
            pollName: 'weekend plan',
            choices: ['hiking', 'cinema'],
        });
        const { id } = parseJson<CreatePollResponse>(createResponse);

        await vote(app, id, {
            voterName: 'Ada',
            votes: {
                hiking: 10,
                cinema: 4,
            },
        });
        await vote(app, id, {
            voterName: 'Grace',
            votes: {
                hiking: 8,
                cinema: 5,
            },
        });

        const pollResponse = await getPoll(app, id);

        expect(pollResponse.statusCode).toBe(200);
        const payload = parseJson<PollResponse>(pollResponse);

        expect(payload.voters).toEqual(
            expect.arrayContaining(['Ada', 'Grace']),
        );
        expect(payload.choices).toEqual(['hiking', 'cinema']);
        expect(payload.results).toBeDefined();

        const { results } = payload;

        if (!results) {
            throw new Error('Expected aggregated results after two votes.');
        }

        expect(results.hiking).toEqual(expect.any(Number));
        expect(results.cinema).toEqual(expect.any(Number));
        expect(results.hiking).toBeCloseTo(8.94, 2);
        expect(results.cinema).toBeCloseTo(4.47, 2);
    });
});
