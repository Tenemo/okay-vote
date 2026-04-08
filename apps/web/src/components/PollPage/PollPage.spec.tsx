import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import PollPage from './PollPage';

import { createAppStore } from 'store/configureStore';
import { useGetPollQuery, useVoteMutation } from 'store/pollsApi';
import { browserVoteLocksStorageKey } from 'store/voteLocksSlice';

vi.mock('copy-to-clipboard', () => ({
    default: vi.fn(),
}));

vi.mock('store/pollsApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('store/pollsApi')>();

    return {
        ...actual,
        useGetPollQuery: vi.fn(),
        useVoteMutation: vi.fn(),
    };
});

const mockedUseGetPollQuery = vi.mocked(useGetPollQuery);
const mockedUseVoteMutation = vi.mocked(useVoteMutation);

const renderPage = (initialEntry = '/votes/best-fruit--aaaabbbb'): void => {
    const store = createAppStore();

    render(
        <Provider store={store}>
            <HelmetProvider>
                <MemoryRouter initialEntries={[initialEntry]}>
                    <Routes>
                        <Route element={<PollPage />} path="/votes/:pollSlug" />
                    </Routes>
                </MemoryRouter>
            </HelmetProvider>
        </Provider>,
    );
};

describe('PollPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
    });

    test('submits votes through the query layer', () => {
        const refetch = vi.fn();
        const submitVote = vi.fn();

        mockedUseGetPollQuery.mockReturnValue({
            data: {
                id: '123e4567-e89b-42d3-a456-426614174000',
                slug: 'best-fruit--aaaabbbb',
                pollName: 'Best fruit',
                createdAt: '2026-04-05T00:00:00.000Z',
                choices: ['Apples'],
                voters: [],
            },
            error: undefined,
            isFetching: false,
            isLoading: false,
            refetch,
        } as never);
        mockedUseVoteMutation.mockReturnValue([
            submitVote,
            {
                error: undefined,
                isLoading: false,
                isSuccess: false,
            },
        ] as never);

        renderPage();

        fireEvent.click(screen.getByRole('button', { name: '7' }));
        fireEvent.change(screen.getByLabelText('Voter name*'), {
            target: { value: 'Ada' },
        });
        fireEvent.click(
            screen.getByRole('button', { name: 'Submit your choices' }),
        );

        expect(submitVote).toHaveBeenCalledWith({
            pollRef: '123e4567-e89b-42d3-a456-426614174000',
            voteData: {
                voterName: 'Ada',
                votes: {
                    Apples: 7,
                },
            },
        });
    });

    test('enables polling options without manual refresh', () => {
        mockedUseGetPollQuery.mockReturnValue({
            data: {
                id: '123e4567-e89b-42d3-a456-426614174000',
                slug: 'best-fruit--aaaabbbb',
                pollName: 'Best fruit',
                createdAt: '2026-04-05T00:00:00.000Z',
                choices: ['Apples'],
                voters: [],
            },
            error: undefined,
            isFetching: false,
            isLoading: false,
            refetch: vi.fn(),
        } as never);
        mockedUseVoteMutation.mockReturnValue([
            vi.fn(),
            {
                error: undefined,
                isLoading: false,
                isSuccess: false,
            },
        ] as never);

        renderPage();

        expect(mockedUseGetPollQuery).toHaveBeenCalledWith(
            'best-fruit--aaaabbbb',
            expect.objectContaining({
                pollingInterval: 5000,
                refetchOnFocus: true,
                refetchOnReconnect: true,
                skipPollingIfUnfocused: true,
            }),
        );

        expect(
            screen.queryByRole('button', { name: 'Refresh vote' }),
        ).not.toBeInTheDocument();
    });

    test('renders RTK Query error messages', () => {
        mockedUseGetPollQuery.mockReturnValue({
            data: undefined,
            error: {
                status: 404,
                data: {
                    message: 'Poll not found.',
                },
            },
            isFetching: false,
            isLoading: false,
            refetch: vi.fn(),
        } as never);
        mockedUseVoteMutation.mockReturnValue([
            vi.fn(),
            {
                error: undefined,
                isLoading: false,
                isSuccess: false,
            },
        ] as never);

        renderPage();

        expect(screen.getByText('Poll not found.')).toBeInTheDocument();
    });

    test('shows a disabled loading state inside the submit button while voting', () => {
        mockedUseGetPollQuery.mockReturnValue({
            data: {
                id: '123e4567-e89b-42d3-a456-426614174000',
                slug: 'best-fruit--aaaabbbb',
                pollName: 'Best fruit',
                createdAt: '2026-04-05T00:00:00.000Z',
                choices: ['Apples'],
                voters: [],
            },
            error: undefined,
            isFetching: false,
            isLoading: false,
            refetch: vi.fn(),
        } as never);
        mockedUseVoteMutation.mockReturnValue([
            vi.fn(),
            {
                error: undefined,
                isLoading: true,
                isSuccess: false,
            },
        ] as never);

        renderPage();

        const submitButton = screen.getByRole('button', {
            name: 'Submitting vote',
        });

        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });

    test('locks voting in the current browser after a successful vote submission', () => {
        mockedUseGetPollQuery.mockReturnValue({
            data: {
                id: '123e4567-e89b-42d3-a456-426614174000',
                slug: 'best-fruit--aaaabbbb',
                pollName: 'Best fruit',
                createdAt: '2026-04-05T00:00:00.000Z',
                choices: ['Apples'],
                voters: ['Ada'],
            },
            error: undefined,
            isFetching: false,
            isLoading: false,
            refetch: vi.fn(),
        } as never);
        mockedUseVoteMutation.mockReturnValue([
            vi.fn(),
            {
                error: undefined,
                isLoading: false,
                isSuccess: true,
            },
        ] as never);

        renderPage();

        expect(screen.getByText('You have voted successfully.')).toBeVisible();
        expect(
            screen.getByText(
                'This browser is now marked as already voted for this vote.',
            ),
        ).toBeVisible();
        expect(
            screen.getByText(
                'This browser has already submitted a vote for this poll.',
            ),
        ).toBeVisible();
        expect(
            screen.queryByRole('button', { name: 'Submit your choices' }),
        ).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Voter name*')).not.toBeInTheDocument();
    });

    test('keeps the browser lock after a refresh by rehydrating it from persisted Redux state', () => {
        window.localStorage.setItem(
            browserVoteLocksStorageKey,
            JSON.stringify({
                lockedPolls: {
                    '123e4567-e89b-42d3-a456-426614174000': true,
                },
            }),
        );

        mockedUseGetPollQuery.mockReturnValue({
            data: {
                id: '123e4567-e89b-42d3-a456-426614174000',
                slug: 'best-fruit--aaaabbbb',
                pollName: 'Best fruit',
                createdAt: '2026-04-05T00:00:00.000Z',
                choices: ['Apples'],
                voters: ['Ada'],
            },
            error: undefined,
            isFetching: false,
            isLoading: false,
            refetch: vi.fn(),
        } as never);
        mockedUseVoteMutation.mockReturnValue([
            vi.fn(),
            {
                error: undefined,
                isLoading: false,
                isSuccess: false,
            },
        ] as never);

        renderPage();

        expect(
            screen.getByText(
                'You have already voted in this browser for this vote.',
            ),
        ).toBeVisible();
        expect(
            screen.getByText(
                'This browser has already submitted a vote for this poll.',
            ),
        ).toBeVisible();
        expect(
            screen.queryByRole('button', { name: 'Submit your choices' }),
        ).not.toBeInTheDocument();
    });

    test('loads polls addressed by UUID browser routes for legacy compatibility', () => {
        const pollId = '123e4567-e89b-42d3-a456-426614174000';

        mockedUseGetPollQuery.mockReturnValue({
            data: {
                id: pollId,
                pollName: 'Best fruit',
                createdAt: '2026-04-05T00:00:00.000Z',
                choices: ['Apples'],
                voters: [],
            },
            error: undefined,
            isFetching: false,
            isLoading: false,
            refetch: vi.fn(),
        } as never);
        mockedUseVoteMutation.mockReturnValue([
            vi.fn(),
            {
                error: undefined,
                isLoading: false,
                isSuccess: false,
            },
        ] as never);

        renderPage('/votes/123e4567-e89b-42d3-a456-426614174000');

        expect(mockedUseGetPollQuery).toHaveBeenCalledWith(
            pollId,
            expect.objectContaining({
                pollingInterval: 5000,
                refetchOnFocus: true,
                refetchOnReconnect: true,
                skipPollingIfUnfocused: true,
            }),
        );
        expect(screen.getByText('Best fruit')).toBeVisible();
    });

    test('falls back to the route slug when the poll payload omits the id', () => {
        const submitVote = vi.fn();

        mockedUseGetPollQuery.mockReturnValue({
            data: {
                slug: 'best-fruit--aaaabbbb',
                pollName: 'Best fruit',
                createdAt: '2026-04-05T00:00:00.000Z',
                choices: ['Apples'],
                voters: [],
            },
            error: undefined,
            isFetching: false,
            isLoading: false,
            refetch: vi.fn(),
        } as never);
        mockedUseVoteMutation.mockReturnValue([
            submitVote,
            {
                error: undefined,
                isLoading: false,
                isSuccess: false,
            },
        ] as never);

        renderPage();

        fireEvent.click(screen.getByRole('button', { name: '7' }));
        fireEvent.change(screen.getByLabelText('Voter name*'), {
            target: { value: 'Ada' },
        });
        fireEvent.click(
            screen.getByRole('button', { name: 'Submit your choices' }),
        );

        expect(submitVote).toHaveBeenCalledWith({
            pollRef: 'best-fruit--aaaabbbb',
            voteData: {
                voterName: 'Ada',
                votes: {
                    Apples: 7,
                },
            },
        });
    });
});
