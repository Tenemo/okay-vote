import { POLL_ROUTES } from '@okay-vote/contracts';
import type {
    CreatePollResponse,
    CreatePollRequest,
    HealthCheckResponse,
    MessageResponse,
    PollResponse,
    VoteRequest,
} from '@okay-vote/contracts';
import type { FastifyInstance } from 'fastify';
import type { OutgoingHttpHeaders } from 'node:http';

export type TestResponse = {
    body: string;
    headers: OutgoingHttpHeaders;
    statusCode: number;
};

export const normalizeResponse = (
    response: Pick<TestResponse, 'body' | 'headers' | 'statusCode'>,
): TestResponse => ({
    body: response.body,
    headers: response.headers,
    statusCode: response.statusCode,
});

export const parseJson = <T>(response: TestResponse): T =>
    JSON.parse(response.body) as T;

export const createPoll = async (
    fastify: FastifyInstance,
    payload: CreatePollRequest,
): Promise<TestResponse> =>
    normalizeResponse(
        await fastify.inject({
            method: 'POST',
            url: POLL_ROUTES.create,
            payload,
        }),
    );

export const fetchPoll = async (
    fastify: FastifyInstance,
    pollRef: string,
): Promise<TestResponse> =>
    normalizeResponse(
        await fastify.inject({
            method: 'GET',
            url: POLL_ROUTES.poll(pollRef),
        }),
    );

export const submitVote = async (
    fastify: FastifyInstance,
    pollRef: string,
    payload: VoteRequest,
): Promise<TestResponse> =>
    normalizeResponse(
        await fastify.inject({
            method: 'POST',
            url: POLL_ROUTES.vote(pollRef),
            payload,
        }),
    );

export const fetchHealthCheck = async (
    fastify: FastifyInstance,
    headers?: Record<string, string>,
): Promise<TestResponse> =>
    normalizeResponse(
        await fastify.inject({
            method: 'GET',
            url: POLL_ROUTES.healthCheck,
            headers,
        }),
    );

export type {
    CreatePollResponse,
    CreatePollRequest,
    HealthCheckResponse,
    MessageResponse,
    PollResponse,
    VoteRequest,
};
