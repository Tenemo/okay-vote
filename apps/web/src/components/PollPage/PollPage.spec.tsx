import { fireEvent, render, screen, within } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import PollPage from './PollPage';

import { useGetPollQuery, useVoteMutation } from 'store/pollsApi';

vi.mock('copy-to-clipboard', () => ({
    default: vi.fn(),
}));

vi.mock('store/pollsApi', () => ({
    useGetPollQuery: vi.fn(),
    useVoteMutation: vi.fn(),
}));

const mockedUseGetPollQuery = vi.mocked(useGetPollQuery);
const mockedUseVoteMutation = vi.mocked(useVoteMutation);

const renderPage = (initialEntry = '/votes/best-fruit--aaaabbbb'): void => {
    render(
        <HelmetProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route element={<PollPage />} path="/votes/:pollSlug" />
                </Routes>
            </MemoryRouter>
        </HelmetProvider>,
    );
};

describe('PollPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
            pollId: '123e4567-e89b-42d3-a456-426614174000',
            voteData: {
                voterName: 'Ada',
                votes: {
                    Apples: 7,
                },
            },
        });
    });

    test('enables polling options and keeps manual refresh', () => {
        const refetch = vi.fn();

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
                pollingInterval: 3000,
                refetchOnFocus: true,
                refetchOnReconnect: true,
                skipPollingIfUnfocused: true,
            }),
        );

        fireEvent.click(screen.getByRole('button', { name: 'Refresh vote' }));

        expect(refetch).toHaveBeenCalled();
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
        expect(within(submitButton).getByRole('status')).toBeInTheDocument();
    });

    test('keeps the form available after a successful vote submission', () => {
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
                'You can submit more scores later with the same voter name.',
            ),
        ).toBeVisible();
        expect(
            screen.getByRole('button', { name: 'Submit your choices' }),
        ).toBeVisible();
        expect(screen.getByLabelText('Voter name*')).toBeVisible();
    });

    test('renders not found and skips poll loading for bare UUID browser routes', () => {
        renderPage('/votes/123e4567-e89b-42d3-a456-426614174000');

        expect(
            screen.getByRole('button', { name: 'Go back to vote creation' }),
        ).toBeInTheDocument();
        expect(mockedUseGetPollQuery).not.toHaveBeenCalled();
        expect(mockedUseVoteMutation).not.toHaveBeenCalled();
    });
});
