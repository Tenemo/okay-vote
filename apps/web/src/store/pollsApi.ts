import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
    CreatePollRequest,
    CreatePollResponse,
    PollResponse,
    VoteRequest,
    VoteResponse,
} from '@okay-vote/contracts';
import { POLL_ROUTES } from '@okay-vote/contracts';
import {
    normalizeApiBaseUrl,
    resolveApiBaseUrl,
    shouldUseProxyApiBaseUrl,
} from '../../config/api-base-url';

const apiBaseUrl = resolveApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL,
    window.location.hostname,
);

export { normalizeApiBaseUrl, resolveApiBaseUrl, shouldUseProxyApiBaseUrl };

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
                result ? [{ type: 'Poll', id: result.id || result.slug }] : [],
        }),
        vote: build.mutation<
            VoteResponse,
            { pollRef: string; voteData: VoteRequest }
        >({
            query: ({ pollRef, voteData }) => ({
                url: POLL_ROUTES.vote(pollRef),
                method: 'POST',
                body: voteData,
                responseHandler: 'text',
            }),
            invalidatesTags: (_result, _error, { pollRef }) => [
                { type: 'Poll', id: pollRef },
            ],
        }),
    }),
});

export const {
    useCreatePollMutation,
    useGetPollQuery,
    useLazyGetPollQuery,
    useVoteMutation,
} = pollsApi;
