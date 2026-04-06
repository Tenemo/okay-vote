import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';

import PollCreationPage from './PollCreationPage';

import { darkTheme } from 'styles/theme';
import { useCreatePollMutation } from 'store/pollsApi';

vi.mock('store/pollsApi', () => ({
    useCreatePollMutation: vi.fn(),
}));

const mockedUseCreatePollMutation = vi.mocked(useCreatePollMutation);

const renderPage = (): void => {
    render(
        <HelmetProvider>
            <ThemeProvider theme={darkTheme}>
                <MemoryRouter>
                    <PollCreationPage />
                </MemoryRouter>
            </ThemeProvider>
        </HelmetProvider>,
    );
};

describe('PollCreationPage', () => {
    test('submits a valid create request and shows the created vote dialog', async () => {
        const createPoll = vi.fn(() => ({
            unwrap: () =>
                Promise.resolve({
                    pollName: 'Team lunch',
                    choices: ['Pizza', 'Ramen'],
                    id: 'poll-1',
                    createdAt: '2026-04-05T00:00:00.000Z',
                }),
        }));

        mockedUseCreatePollMutation.mockReturnValue([
            createPoll,
            {
                isLoading: false,
                error: undefined,
            },
        ] as never);

        renderPage();

        fireEvent.change(screen.getByLabelText(/Vote name/i), {
            target: { value: ' Team lunch ' },
        });
        fireEvent.change(screen.getByLabelText('Choice to vote for'), {
            target: { value: 'Pizza' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Add new choice' }));
        fireEvent.change(screen.getByLabelText('Choice to vote for'), {
            target: { value: 'Ramen' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Add new choice' }));
        fireEvent.click(screen.getByRole('button', { name: 'Create vote' }));

        await waitFor(() => {
            expect(createPoll).toHaveBeenCalledWith({
                pollName: 'Team lunch',
                choices: ['Pizza', 'Ramen'],
            });
        });

        expect(
            await screen.findByText('Vote successfully created!'),
        ).toBeInTheDocument();
    });
});
