import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
    DEFAULT_VOTE_SCORE,
    MINIMUM_END_POLL_VOTERS,
} from '@okay-vote/contracts';

import PollPage from './PollPage';

import { createAppStore } from 'store/configureStore';
import { organizerTokensStorageKey } from 'store/organizerTokensSlice';
import {
    useEndPollMutation,
    useGetPollQuery,
    useVoteMutation,
} from 'store/pollsApi';
import { voteLocksStorageKey } from 'store/voteLocksSlice';

vi.mock('copy-to-clipboard', () => ({
    default: vi.fn(),
}));

vi.mock('store/pollsApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('store/pollsApi')>();

    return {
        ...actual,
        useEndPollMutation: vi.fn(),
        useGetPollQuery: vi.fn(),
        useVoteMutation: vi.fn(),
    };
});

const mockedUseEndPollMutation = vi.mocked(useEndPollMutation);
const mockedUseGetPollQuery = vi.mocked(useGetPollQuery);
const mockedUseVoteMutation = vi.mocked(useVoteMutation);
const getMetaContent = (selector: string): string | null =>
    document.head.querySelector(selector)?.getAttribute('content') ?? null;

const basePoll = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    slug: 'best-fruit--aaaabbbb',
    pollName: 'Best fruit',
    createdAt: '2026-04-05T00:00:00.000Z',
    choices: ['Apples'],
    voters: [] as string[],
};

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
        mockedUseEndPollMutation.mockReturnValue([
            vi.fn(),
            {
                error: undefined,
                isLoading: false,
            },
        ] as never);
    });

    test('submits votes through the query layer', () => {
        const submitVote = vi.fn();

        mockedUseGetPollQuery.mockReturnValue({
            data: basePoll,
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
            data: basePoll,
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
    });

    test('renders score-voting SEO metadata for an open poll', () => {
        mockedUseGetPollQuery.mockReturnValue({
            data: basePoll,
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

        expect(document.title).toBe('Best fruit | okay.vote');
        expect(getMetaContent('meta[name="description"]')).toBe(
            'Score every option in Best fruit from 1 to 10 with the okay.vote app.',
        );
        expect(getMetaContent('meta[property="og:url"]')).toBe(
            'https://okay.vote/votes/best-fruit--aaaabbbb',
        );
        expect(getMetaContent('meta[name="twitter:card"]')).toBe(
            'summary_large_image',
        );
        expect(
            screen.getByText(
                `Score every option from 1 to 10. Each choice starts at ${DEFAULT_VOTE_SCORE}, and final results are calculated from the geometric mean of submitted votes.`,
            ),
        ).toBeVisible();
    });

    test('submits default scores for untouched choices', () => {
        const submitVote = vi.fn();

        mockedUseGetPollQuery.mockReturnValue({
            data: {
                ...basePoll,
                choices: ['Apples', 'Bananas'],
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
                    Apples: DEFAULT_VOTE_SCORE,
                    Bananas: DEFAULT_VOTE_SCORE,
                },
            },
        });
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
            data: basePoll,
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

    test('shows the creation date and lets only the organizer end an open poll', () => {
        const endPoll = vi.fn(() => ({
            unwrap: () => Promise.resolve({}),
        }));

        window.localStorage.setItem(
            organizerTokensStorageKey,
            JSON.stringify({
                organizerTokensByPollRef: {
                    '123e4567-e89b-42d3-a456-426614174000':
                        'organizer-secret-token',
                },
            }),
        );

        mockedUseGetPollQuery.mockReturnValue({
            data: {
                ...basePoll,
                voters: ['Ada', 'Grace'],
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
        mockedUseEndPollMutation.mockReturnValue([
            endPoll,
            {
                error: undefined,
                isLoading: false,
            },
        ] as never);

        renderPage();

        expect(screen.getByText('Created on 2026-04-05')).toBeVisible();
        const endPollButton = screen.getByRole('button', {
            name: 'Close poll and show results',
        });

        expect(endPollButton).toBeEnabled();
        expect(endPollButton).toHaveClass('bg-primary');
        fireEvent.click(endPollButton);

        expect(endPoll).toHaveBeenCalledWith({
            pollRef: '123e4567-e89b-42d3-a456-426614174000',
            endPollData: {
                organizerToken: 'organizer-secret-token',
            },
        });
    });

    test('keeps the close button loading until the poll view updates', () => {
        const endPoll = vi.fn(() => ({
            unwrap: () => new Promise<never>(() => {}),
        }));

        window.localStorage.setItem(
            organizerTokensStorageKey,
            JSON.stringify({
                organizerTokensByPollRef: {
                    '123e4567-e89b-42d3-a456-426614174000':
                        'organizer-secret-token',
                },
            }),
        );

        mockedUseGetPollQuery.mockReturnValue({
            data: {
                ...basePoll,
                voters: ['Ada', 'Grace'],
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
        mockedUseEndPollMutation.mockReturnValue([
            endPoll,
            {
                error: undefined,
                isLoading: false,
            },
        ] as never);

        renderPage();
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Close poll and show results',
            }),
        );

        const closeButton = screen.getByRole('button', {
            name: 'Closing poll',
        });

        expect(endPoll).toHaveBeenCalledTimes(1);
        expect(closeButton).toBeDisabled();
        expect(closeButton).toHaveAttribute('aria-busy', 'true');
    });

    test('does not show organizer controls without a stored organizer token', () => {
        mockedUseGetPollQuery.mockReturnValue({
            data: basePoll,
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
            screen.queryByRole('button', {
                name: 'Close poll and show results',
            }),
        ).not.toBeInTheDocument();
    });

    test('disables ending the poll until at least two people have voted', () => {
        window.localStorage.setItem(
            organizerTokensStorageKey,
            JSON.stringify({
                organizerTokensByPollRef: {
                    '123e4567-e89b-42d3-a456-426614174000':
                        'organizer-secret-token',
                },
            }),
        );

        mockedUseGetPollQuery.mockReturnValue({
            data: {
                ...basePoll,
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
                `At least ${MINIMUM_END_POLL_VOTERS} people must vote before you can close the poll and show results.`,
            ),
        ).toBeVisible();
        expect(
            screen.getByRole('button', {
                name: 'Close poll and show results',
            }),
        ).toBeDisabled();
    });

    test('renders ended poll results automatically and suppresses the voting form', () => {
        mockedUseGetPollQuery.mockReturnValue({
            data: {
                ...basePoll,
                endedAt: '2026-04-06T00:00:00.000Z',
                results: {
                    Apples: 7,
                },
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

        expect(screen.getByText('Results')).toBeVisible();
        expect(screen.getByText('Score: 7')).toBeVisible();
        expect(
            screen.queryByText('Voting is closed for this poll.'),
        ).not.toBeInTheDocument();
        expect(screen.queryByText('Cast your vote')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Submit your choices' }),
        ).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Voter name*')).not.toBeInTheDocument();
    });

    test('renders the empty ended-results message when no votes were submitted', () => {
        mockedUseGetPollQuery.mockReturnValue({
            data: {
                ...basePoll,
                endedAt: '2026-04-06T00:00:00.000Z',
                results: {},
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
            screen.getByText('No votes were submitted before this poll ended.'),
        ).toBeVisible();
    });

    test('locks voting in the current app session after a successful vote submission', () => {
        mockedUseGetPollQuery.mockReturnValue({
            data: {
                ...basePoll,
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

        const successAlert = screen.getByRole('alert');

        expect(screen.getByText('You have voted successfully.')).toBeVisible();
        expect(successAlert).toHaveClass('border-emerald-500/45');
        expect(screen.queryByText('Cast your vote')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Submit your choices' }),
        ).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Voter name*')).not.toBeInTheDocument();
    });

    test('keeps the vote lock after a refresh by rehydrating it from persisted Redux state', () => {
        window.localStorage.setItem(
            voteLocksStorageKey,
            JSON.stringify({
                lockedPolls: {
                    '123e4567-e89b-42d3-a456-426614174000': true,
                },
            }),
        );

        mockedUseGetPollQuery.mockReturnValue({
            data: {
                ...basePoll,
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

        const successAlert = screen.getByRole('alert');

        expect(screen.getByText('You have voted successfully.')).toBeVisible();
        expect(successAlert).toHaveClass('border-emerald-500/45');
        expect(screen.queryByText('Cast your vote')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Submit your choices' }),
        ).not.toBeInTheDocument();
    });

    test('loads polls addressed by UUID-based routes for legacy compatibility', () => {
        const pollId = '123e4567-e89b-42d3-a456-426614174000';

        mockedUseGetPollQuery.mockReturnValue({
            data: {
                ...basePoll,
                id: pollId,
                slug: undefined,
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
                ...basePoll,
                id: undefined,
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
