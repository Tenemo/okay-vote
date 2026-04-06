import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
    CreatePollRequest,
    CreatePollResponse,
    PollResponse,
    VoteRequest,
    VoteResponse,
} from '@okay-vote/contracts';
import { POLL_ROUTES } from '@okay-vote/contracts';

export const normalizeApiBaseUrl = (baseUrl: string): string =>
    baseUrl.replace(/\/+$/, '').replace(/\/api$/, '');

export const shouldUseProxyApiBaseUrl = (hostname: string): boolean =>
    hostname === 'okay.vote' ||
    hostname === 'www.okay.vote' ||
    hostname.endsWith('.netlify.app');

export const resolveApiBaseUrl = (
    configuredApiBaseUrl: string | undefined,
    hostname?: string,
): string => {
    const trimmedApiBaseUrl = configuredApiBaseUrl?.trim();

    if (hostname && shouldUseProxyApiBaseUrl(hostname)) {
        return '/';
    }

    return trimmedApiBaseUrl
        ? normalizeApiBaseUrl(trimmedApiBaseUrl) || '/'
        : '/';
};

const apiBaseUrl = resolveApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL,
    window.location.hostname,
);

export const pollsApi = createApi({
    reducerPath: 'pollsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: apiBaseUrl,
    }),
    tagTypes: ['Poll'],
    endpoints: (build) => ({
        createPoll: build.mutation<CreatePollResponse, CreatePollRequest>({
            query: (pollData) => ({
                url: POLL_ROUTES.create,
                method: 'POST',
                body: pollData,
            }),
        }),
        getPoll: build.query<PollResponse, string>({
            query: (pollRef) => ({
                url: POLL_ROUTES.poll(pollRef),
                method: 'GET',
            }),
            providesTags: (result) =>
                result ? [{ type: 'Poll', id: result.id }] : [],
        }),
        vote: build.mutation<
            VoteResponse,
            { pollId: string; voteData: VoteRequest }
        >({
            query: ({ pollId, voteData }) => ({
                url: POLL_ROUTES.vote(pollId),
                method: 'POST',
                body: voteData,
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, { pollId }) => [
                { type: 'Poll', id: pollId },
            ],
        }),
    }),
});

export const { useCreatePollMutation, useGetPollQuery, useVoteMutation } =
    pollsApi;
