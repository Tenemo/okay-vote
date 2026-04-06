import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import PollPage from './PollPage';

import { darkTheme } from 'styles/theme';
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

const renderPage = (): void => {
    render(
        <HelmetProvider>
            <ThemeProvider theme={darkTheme}>
                <MemoryRouter initialEntries={['/votes/poll-1']}>
                    <Routes>
                        <Route element={<PollPage />} path="/votes/:pollId" />
                    </Routes>
                </MemoryRouter>
            </ThemeProvider>
        </HelmetProvider>,
    );
};

describe('PollPage', () => {
    test('submits votes through the query layer', () => {
        const refetch = vi.fn();
        const submitVote = vi.fn();

        mockedUseGetPollQuery.mockReturnValue({
            data: {
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
            pollId: 'poll-1',
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
            'poll-1',
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
});
