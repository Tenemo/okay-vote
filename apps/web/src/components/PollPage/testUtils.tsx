import { type ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import type { PollResponse } from '@okay-vote/contracts';

import { createAppStore } from 'store/configureStore';
import { organizerTokensStorageKey } from 'store/organizerTokensSlice';
import { voteLocksStorageKey } from 'store/voteLocksSlice';

type MockPoll = Omit<PollResponse, 'id' | 'slug' | 'endedAt' | 'results'> & {
    id?: string;
    slug?: string;
    endedAt?: string;
    results?: Record<string, number>;
};

export const basePoll: MockPoll = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    slug: 'best-fruit--aaaabbbb',
    pollName: 'Best fruit',
    createdAt: '2026-04-05T00:00:00.000Z',
    choices: ['Apples'],
    voters: [],
};

export const getMetaContent = (selector: string): string | null =>
    document.head.querySelector(selector)?.getAttribute('content') ?? null;

export const renderPollPage = (
    page: ReactElement,
    initialEntry = '/votes/best-fruit--aaaabbbb',
): void => {
    window.history.replaceState({}, '', initialEntry);

    const store = createAppStore();

    render(
        <Provider store={store}>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route element={page} path="/votes/:pollRef" />
                </Routes>
            </MemoryRouter>
        </Provider>,
    );
};

export const setStoredOrganizerTokens = (
    organizerTokensByPollRef: Record<string, string>,
): void => {
    window.localStorage.setItem(
        organizerTokensStorageKey,
        JSON.stringify({
            organizerTokensByPollRef,
        }),
    );
};

export const setStoredVoteLocks = (lockedPolls: Record<string, true>): void => {
    window.localStorage.setItem(
        voteLocksStorageKey,
        JSON.stringify({
            lockedPolls,
        }),
    );
};
