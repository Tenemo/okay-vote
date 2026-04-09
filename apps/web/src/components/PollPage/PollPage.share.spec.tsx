import copy from 'copy-to-clipboard';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { DEFAULT_VOTE_SCORE } from '@okay-vote/contracts';

import PollPage from './PollPage';
import { basePoll, getMetaContent, renderPollPage } from './testUtils';

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
    mockedUseVoteMutation.mockReturnValue([
        vi.fn(),
        {
            error: undefined,
            isLoading: false,
            isSuccess: false,
        },
    ] as never);
};

describe('PollPage share and metadata', () => {
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

    test('enables polling options without manual refresh', () => {
        mockPollPage();

        renderPollPage(<PollPage />);

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
        mockPollPage();

        renderPollPage(<PollPage />);

        expect(document.title).toBe('Best fruit');
        expect(getMetaContent('meta[name="description"]')).toBe(
            'Score options from 1 to 10.',
        );
        expect(getMetaContent('meta[property="og:url"]')).toBe(
            'https://okay.vote/votes/best-fruit--aaaabbbb',
        );
        expect(getMetaContent('meta[property="og:image"]')).toBe(
            'https://okay.vote/og/vote/best-fruit--aaaabbbb',
        );
        expect(getMetaContent('meta[property="og:image:alt"]')).toBe(
            'Preview image for Best fruit on okay.vote.',
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

    test('renders results SEO metadata for an ended poll', () => {
        mockPollPage({
            ...basePoll,
            endedAt: '2026-04-08T10:15:00.000Z',
            results: {
                Apples: 8.94,
            },
            voters: ['Ada', 'Grace'],
        });

        renderPollPage(<PollPage />);

        expect(document.title).toBe('Best fruit');
        expect(getMetaContent('meta[name="description"]')).toBe(
            'Voting results',
        );
        expect(getMetaContent('meta[property="og:image"]')).toBe(
            'https://okay.vote/og/vote/best-fruit--aaaabbbb?v=2026-04-08T10%3A15%3A00.000Z',
        );
        expect(getMetaContent('meta[property="og:image:alt"]')).toBe(
            'Final results preview for Best fruit on okay.vote.',
        );
    });

    test('shows temporary feedback after copying the vote link', () => {
        mockPollPage();

        renderPollPage(<PollPage />);
        fireEvent.click(screen.getByRole('button', { name: 'Copy vote link' }));

        expect(mockedCopy).toHaveBeenCalledWith(window.location.href);
        expect(screen.getByText('Link copied.')).toBeVisible();
    });

    test('uses the browser share api when it is available', async () => {
        const share = vi.fn(() => Promise.resolve());

        Object.defineProperty(window.navigator, 'share', {
            configurable: true,
            value: share,
        });

        mockPollPage();

        renderPollPage(<PollPage />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Share vote link' }),
        );

        await waitFor(() => {
            expect(share).toHaveBeenCalledWith({
                text: 'Best fruit',
                title: 'Best fruit',
                url: window.location.href,
            });
        });
        expect(screen.getByText('Share sheet opened.')).toBeVisible();
    });

    test('falls back to copying the vote link when browser sharing is unavailable', () => {
        mockPollPage();

        renderPollPage(<PollPage />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Share vote link' }),
        );

        expect(mockedCopy).toHaveBeenCalledWith(window.location.href);
        expect(
            screen.getByText(
                'Sharing is not available here. Link copied instead.',
            ),
        ).toBeVisible();
    });
});
