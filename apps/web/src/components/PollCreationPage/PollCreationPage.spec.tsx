import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import PollCreationPage from './PollCreationPage';

import { useCreatePollMutation, useLazyGetPollQuery } from 'store/pollsApi';

vi.mock('store/pollsApi', () => ({
    useCreatePollMutation: vi.fn(),
    useLazyGetPollQuery: vi.fn(),
}));

const mockedUseCreatePollMutation = vi.mocked(useCreatePollMutation);
const mockedUseLazyGetPollQuery = vi.mocked(useLazyGetPollQuery);

const renderPage = (): void => {
    render(
        <HelmetProvider>
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route element={<PollCreationPage />} path="/" />
                    <Route
                        element={<div>Slug vote page</div>}
                        path="/votes/:pollSlug"
                    />
                </Routes>
            </MemoryRouter>
        </HelmetProvider>,
    );
};

describe('PollCreationPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedUseLazyGetPollQuery.mockReturnValue([vi.fn()] as never);
    });

    test('shows a disabled loading state inside the create vote button', () => {
        mockedUseCreatePollMutation.mockReturnValue([
            vi.fn(),
            {
                isLoading: true,
                error: undefined,
            },
        ] as never);

        renderPage();

        const createButton = screen.getByRole('button', {
            name: 'Creating vote',
        });

        expect(createButton).toBeDisabled();
        expect(createButton).toHaveAttribute('aria-busy', 'true');
        expect(within(createButton).getByRole('status')).toBeInTheDocument();
    });

    test('shows a useful error when the create request fails', async () => {
        const createPoll = vi.fn(() => ({
            unwrap: () =>
                Promise.reject(
                    Object.assign(new Error('Unable to create vote.'), {
                        status: 500,
                        data: {
                            message: 'Unable to create vote.',
                        },
                    }),
                ),
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
            target: { value: 'Team lunch' },
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

        expect(
            await screen.findByText('Unable to create vote.'),
        ).toBeInTheDocument();
    });

    test('submits a valid create request and shows the created vote dialog', async () => {
        const getPollByRef = vi.fn();
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

        mockedUseLazyGetPollQuery.mockReturnValue([getPollByRef] as never);
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
        expect(getPollByRef).not.toHaveBeenCalled();
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

    test('resolves the canonical slug before showing the created vote dialog when create omits it', async () => {
        const pollId = '123e4567-e89b-42d3-a456-426614174000';
        const getPollByRef = vi.fn(() => ({
            unwrap: () =>
                Promise.resolve({
                    id: pollId,
                    slug: 'team-lunch--aaaabbbb',
                    pollName: 'Team lunch',
                    createdAt: '2026-04-05T00:00:00.000Z',
                    choices: ['Pizza', 'Ramen'],
                    voters: [],
                }),
        }));
        const createPoll = vi.fn(() => ({
            unwrap: () =>
                Promise.resolve({
                    pollName: 'Team lunch',
                    choices: ['Pizza', 'Ramen'],
                    id: pollId,
                    createdAt: '2026-04-05T00:00:00.000Z',
                }),
        }));

        mockedUseLazyGetPollQuery.mockReturnValue([getPollByRef] as never);
        mockedUseCreatePollMutation.mockReturnValue([
            createPoll,
            {
                isLoading: false,
                error: undefined,
            },
        ] as never);

        renderPage();

        fireEvent.change(screen.getByLabelText(/Vote name/i), {
            target: { value: 'Team lunch' },
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

        expect(
            await screen.findByText('Vote successfully created!'),
        ).toBeInTheDocument();
        expect(getPollByRef).toHaveBeenCalledWith(pollId, true);
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

    test('shows a useful error when the canonical slug lookup fails', async () => {
        const slugResolutionError = Object.assign(
            new Error('Failed to resolve the newly created vote link.'),
            {
                status: 500,
                data: {
                    message: 'Failed to resolve the newly created vote link.',
                },
            },
        );
        const getPollByRef = vi.fn(() => ({
            unwrap: () => Promise.reject(slugResolutionError),
        }));
        const createPoll = vi.fn(() => ({
            unwrap: () =>
                Promise.resolve({
                    pollName: 'Team lunch',
                    choices: ['Pizza', 'Ramen'],
                    id: '123e4567-e89b-42d3-a456-426614174000',
                    createdAt: '2026-04-05T00:00:00.000Z',
                }),
        }));

        mockedUseLazyGetPollQuery.mockReturnValue([getPollByRef] as never);
        mockedUseCreatePollMutation.mockReturnValue([
            createPoll,
            {
                isLoading: false,
                error: undefined,
            },
        ] as never);

        renderPage();

        fireEvent.change(screen.getByLabelText(/Vote name/i), {
            target: { value: 'Team lunch' },
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

        expect(
            await screen.findByText(
                'Failed to resolve the newly created vote link.',
            ),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('Vote successfully created!'),
        ).not.toBeInTheDocument();
    });
});
