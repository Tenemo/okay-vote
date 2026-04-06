import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

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
                <MemoryRouter initialEntries={['/']}>
                    <Routes>
                        <Route element={<PollCreationPage />} path="/" />
                        <Route
                            element={<div>Slug vote page</div>}
                            path="/votes/:pollSlug"
                        />
                    </Routes>
                </MemoryRouter>
            </ThemeProvider>
        </HelmetProvider>,
    );
};

describe('PollCreationPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('submits a valid create request and shows the created vote dialog', async () => {
        const createPoll = vi.fn(() => ({
            unwrap: () =>
                Promise.resolve({
                    pollName: 'Team lunch',
                    choices: ['Pizza', 'Ramen'],
                    id: '123e4567-e89b-42d3-a456-426614174000',
                    slug: 'team-lunch--aaaabbbb',
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
            target: { value: ' Pizza ' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Add new choice' }));
        fireEvent.change(screen.getByLabelText('Choice to vote for'), {
            target: { value: ' Ramen ' },
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
        expect(screen.getByRole('link')).toHaveAttribute(
            'href',
            new URL(
                '/votes/team-lunch--aaaabbbb',
                window.location.origin,
            ).toString(),
        );

        fireEvent.click(screen.getByRole('button', { name: 'Go to vote' }));

        expect(await screen.findByText('Slug vote page')).toBeInTheDocument();
    });
});
