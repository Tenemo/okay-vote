import copy from 'copy-to-clipboard';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DEFAULT_VOTE_SCORE } from '@okay-vote/contracts';

import PollPage from './PollPage';
import { basePoll, renderPollPage, setStoredVoteLocks } from './testUtils';

import {
    useEndPollMutation,
    useGetPollQuery,
    useVoteMutation,
} from 'store/pollsApi';

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
const mockedCopy = vi.mocked(copy);

const mockPollPage = (poll = basePoll): void => {
    mockedUseGetPollQuery.mockReturnValue({
        data: poll,
        error: undefined,
        isFetching: false,
        isLoading: false,
        refetch: vi.fn(),
    } as never);
};

describe('PollPage voting', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        mockedCopy.mockReturnValue(true);
        Reflect.deleteProperty(window.navigator, 'share');
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

        mockPollPage();
        mockedUseVoteMutation.mockReturnValue([
            submitVote,
            {
                error: undefined,
                isLoading: false,
                isSuccess: false,
            },
        ] as never);

        renderPollPage(<PollPage />);

        fireEvent.click(screen.getAllByRole('radio', { name: '7' })[0]);
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

    test('submits the vote form when enter is pressed from the voter name input', async () => {
        const user = userEvent.setup();
        const submitVote = vi.fn();

        mockPollPage({
            ...basePoll,
            choices: ['Apples', 'Bananas'],
        });
        mockedUseVoteMutation.mockReturnValue([
            submitVote,
            {
                error: undefined,
                isLoading: false,
                isSuccess: false,
            },
        ] as never);

        renderPollPage(<PollPage />);

        await user.click(screen.getAllByRole('radio', { name: '7' })[0]);
        await user.type(screen.getByLabelText('Voter name*'), 'Ada{Enter}');

        await waitFor(() => {
            expect(submitVote).toHaveBeenCalledWith({
                pollRef: '123e4567-e89b-42d3-a456-426614174000',
                voteData: {
                    voterName: 'Ada',
                    votes: {
                        Apples: 7,
                        Bananas: DEFAULT_VOTE_SCORE,
                    },
                },
            });
        });
    });

    test('submits default scores for untouched choices', () => {
        const submitVote = vi.fn();

        mockPollPage({
            ...basePoll,
            choices: ['Apples', 'Bananas'],
        });
        mockedUseVoteMutation.mockReturnValue([
            submitVote,
            {
                error: undefined,
                isLoading: false,
                isSuccess: false,
            },
        ] as never);

        renderPollPage(<PollPage />);

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

        renderPollPage(<PollPage />);

        expect(screen.getByText('Poll not found.')).toBeInTheDocument();
    });

    test('shows a disabled loading state inside the submit button while voting', () => {
        mockPollPage();
        mockedUseVoteMutation.mockReturnValue([
            vi.fn(),
            {
                error: undefined,
                isLoading: true,
                isSuccess: false,
            },
        ] as never);

        renderPollPage(<PollPage />);

        const submitButton = screen.getByRole('button', {
            name: 'Submitting vote',
        });

        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });

    test('locks voting in the current app session after a successful vote submission', () => {
        mockPollPage({
            ...basePoll,
            voters: ['Ada'],
        });
        mockedUseVoteMutation.mockReturnValue([
            vi.fn(),
            {
                error: undefined,
                isLoading: false,
                isSuccess: true,
            },
        ] as never);

        renderPollPage(<PollPage />);

        const successAlert = screen.getByRole('status');

        expect(screen.getByText('You have voted successfully.')).toBeVisible();
        expect(successAlert).toHaveClass('border-emerald-500/45');
        expect(screen.queryByText('Cast your vote')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Submit your choices' }),
        ).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Voter name*')).not.toBeInTheDocument();
    });

    test('keeps the vote lock after a refresh by rehydrating it from persisted Redux state', () => {
        setStoredVoteLocks({
            '123e4567-e89b-42d3-a456-426614174000': true,
        });
        mockPollPage({
            ...basePoll,
            voters: ['Ada'],
        });
        mockedUseVoteMutation.mockReturnValue([
            vi.fn(),
            {
                error: undefined,
                isLoading: false,
                isSuccess: false,
            },
        ] as never);

        renderPollPage(<PollPage />);

        const successAlert = screen.getByRole('status');

        expect(screen.getByText('You have voted successfully.')).toBeVisible();
        expect(successAlert).toHaveClass('border-emerald-500/45');
        expect(screen.queryByText('Cast your vote')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Submit your choices' }),
        ).not.toBeInTheDocument();
    });

    test('loads polls addressed by UUID-based routes for legacy compatibility', () => {
        const pollId = '123e4567-e89b-42d3-a456-426614174000';

        mockPollPage({
            ...basePoll,
            id: pollId,
            slug: undefined,
        });
        mockedUseVoteMutation.mockReturnValue([
            vi.fn(),
            {
                error: undefined,
                isLoading: false,
                isSuccess: false,
            },
        ] as never);

        renderPollPage(
            <PollPage />,
            '/votes/123e4567-e89b-42d3-a456-426614174000',
        );

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

        mockPollPage({
            ...basePoll,
            id: undefined,
        });
        mockedUseVoteMutation.mockReturnValue([
            submitVote,
            {
                error: undefined,
                isLoading: false,
                isSuccess: false,
            },
        ] as never);

        renderPollPage(<PollPage />);

        fireEvent.click(screen.getAllByRole('radio', { name: '7' })[0]);
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
