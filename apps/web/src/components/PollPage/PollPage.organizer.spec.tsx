import { fireEvent, screen, within } from '@testing-library/react';

import { MINIMUM_END_POLL_VOTERS } from '@okay-vote/contracts';

import PollPage from './PollPage';
import {
    basePoll,
    renderPollPage,
    setStoredOrganizerTokens,
} from './testUtils';

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

const mockPollPage = (poll = basePoll): void => {
    mockedUseGetPollQuery.mockReturnValue({
        data: poll,
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
};

describe('PollPage organizer and results', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        Reflect.deleteProperty(window.navigator, 'share');
        mockedUseEndPollMutation.mockReturnValue([
            vi.fn(),
            {
                error: undefined,
                isLoading: false,
            },
        ] as never);
    });

    test('renders participants as semantic list items', () => {
        mockPollPage({
            ...basePoll,
            voters: ['Ada', 'Grace'],
        });

        renderPollPage(<PollPage />);

        const participantsSection = screen
            .getByRole('heading', { name: 'Participants' })
            .closest('section');

        expect(participantsSection).not.toBeNull();
        expect(
            within(participantsSection as HTMLElement).getAllByRole('listitem'),
        ).toHaveLength(2);
        expect(
            within(participantsSection as HTMLElement).getByText('Ada'),
        ).toBeVisible();
        expect(
            within(participantsSection as HTMLElement).getByText('Grace'),
        ).toBeVisible();
    });

    test('shows the creation date and lets only the organizer end an open poll', () => {
        const endPoll = vi.fn(() => ({
            unwrap: () => Promise.resolve({}),
        }));

        setStoredOrganizerTokens({
            '123e4567-e89b-42d3-a456-426614174000': 'organizer-secret-token',
        });
        mockPollPage({
            ...basePoll,
            voters: ['Ada', 'Grace'],
        });
        mockedUseEndPollMutation.mockReturnValue([
            endPoll,
            {
                error: undefined,
                isLoading: false,
            },
        ] as never);

        renderPollPage(<PollPage />);

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

        setStoredOrganizerTokens({
            '123e4567-e89b-42d3-a456-426614174000': 'organizer-secret-token',
        });
        mockPollPage({
            ...basePoll,
            voters: ['Ada', 'Grace'],
        });
        mockedUseEndPollMutation.mockReturnValue([
            endPoll,
            {
                error: undefined,
                isLoading: false,
            },
        ] as never);

        renderPollPage(<PollPage />);
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
        mockPollPage();

        renderPollPage(<PollPage />);

        expect(
            screen.queryByRole('button', {
                name: 'Close poll and show results',
            }),
        ).not.toBeInTheDocument();
    });

    test('disables ending the poll until at least two people have voted', () => {
        setStoredOrganizerTokens({
            '123e4567-e89b-42d3-a456-426614174000': 'organizer-secret-token',
        });
        mockPollPage({
            ...basePoll,
            voters: ['Ada'],
        });

        renderPollPage(<PollPage />);

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
        mockPollPage({
            ...basePoll,
            endedAt: '2026-04-06T00:00:00.000Z',
            results: {
                Apples: 7,
            },
            voters: ['Ada'],
        });

        renderPollPage(<PollPage />);

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
        mockPollPage({
            ...basePoll,
            endedAt: '2026-04-06T00:00:00.000Z',
            results: {},
        });

        renderPollPage(<PollPage />);

        expect(
            screen.getByText('No votes were submitted before this poll ended.'),
        ).toBeVisible();
    });
});
