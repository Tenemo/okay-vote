import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import PollCreationPage from './PollCreationPage';

import { createAppStore } from 'store/configureStore';
import { organizerTokensStorageKey } from 'store/organizerTokensSlice';
import { useCreatePollMutation, useLazyGetPollQuery } from 'store/pollsApi';

vi.mock('store/pollsApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('store/pollsApi')>();

    return {
        ...actual,
        useCreatePollMutation: vi.fn(),
        useLazyGetPollQuery: vi.fn(),
    };
});

const mockedUseCreatePollMutation = vi.mocked(useCreatePollMutation);
const mockedUseLazyGetPollQuery = vi.mocked(useLazyGetPollQuery);

const renderPage = (): void => {
    const store = createAppStore();

    render(
        <Provider store={store}>
            <HelmetProvider>
                <MemoryRouter initialEntries={['/']}>
                    <Routes>
                        <Route element={<PollCreationPage />} path="/" />
                        <Route
                            element={<div>Vote page</div>}
                            path="/votes/:pollSlug"
                        />
                    </Routes>
                </MemoryRouter>
            </HelmetProvider>
        </Provider>,
    );
};

const fillValidForm = (): void => {
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
};

describe('PollCreationPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
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
    });

    test('keeps the create button loading after submit until redirect starts', () => {
        const createPoll = vi.fn(() => ({
            unwrap: () => new Promise(() => undefined),
        }));

        mockedUseCreatePollMutation.mockReturnValue([
            createPoll,
            {
                isLoading: false,
                error: undefined,
            },
        ] as never);

        renderPage();
        fillValidForm();
        fireEvent.click(screen.getByRole('button', { name: 'Create vote' }));

        const createButton = screen.getByRole('button', {
            name: 'Creating vote',
        });

        expect(createPoll).toHaveBeenCalledTimes(1);
        expect(createButton).toBeDisabled();
        expect(createButton).toHaveAttribute('aria-busy', 'true');
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
        fillValidForm();
        fireEvent.click(screen.getByRole('button', { name: 'Create vote' }));

        expect(
            await screen.findByText('Unable to create vote.'),
        ).toBeInTheDocument();
    });

    test('submits a valid create request, redirects immediately, and persists organizer access', async () => {
        const getPollByRef = vi.fn();
        const createPoll = vi.fn(() => ({
            unwrap: () =>
                Promise.resolve({
                    pollName: 'Team lunch',
                    choices: ['Pizza', 'Ramen'],
                    id: '123e4567-e89b-42d3-a456-426614174000',
                    slug: 'team-lunch--aaaabbbb',
                    createdAt: '2026-04-05T00:00:00.000Z',
                    organizerToken:
                        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
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
        fillValidForm();
        fireEvent.click(screen.getByRole('button', { name: 'Create vote' }));

        await waitFor(() => {
            expect(createPoll).toHaveBeenCalledWith({
                pollName: 'Team lunch',
                choices: ['Pizza', 'Ramen'],
            });
        });

        expect(await screen.findByText('Vote page')).toBeInTheDocument();
        expect(getPollByRef).not.toHaveBeenCalled();
        expect(
            JSON.parse(
                window.localStorage.getItem(organizerTokensStorageKey) ?? '{}',
            ),
        ).toEqual({
            organizerTokensByPollRef: {
                '123e4567-e89b-42d3-a456-426614174000':
                    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
                'team-lunch--aaaabbbb':
                    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
            },
        });
        expect(
            screen.queryByText('Vote successfully created!'),
        ).not.toBeInTheDocument();
    });

    test('resolves the canonical slug before redirecting when create omits it', async () => {
        const pollId = '123e4567-e89b-42d3-a456-426614174000';
        const organizerToken =
            'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
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
                    organizerToken,
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
        fillValidForm();
        fireEvent.click(screen.getByRole('button', { name: 'Create vote' }));

        expect(await screen.findByText('Vote page')).toBeInTheDocument();
        expect(getPollByRef).toHaveBeenCalledWith(pollId, true);
        expect(
            JSON.parse(
                window.localStorage.getItem(organizerTokensStorageKey) ?? '{}',
            ),
        ).toEqual({
            organizerTokensByPollRef: {
                [pollId]: organizerToken,
                'team-lunch--aaaabbbb': organizerToken,
            },
        });
    });

    test('falls back to the poll ID route when slug resolution omits the slug too', async () => {
        const pollId = '123e4567-e89b-42d3-a456-426614174000';
        const organizerToken =
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
        const getPollByRef = vi.fn(() => ({
            unwrap: () =>
                Promise.resolve({
                    id: pollId,
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
                    organizerToken,
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
        fillValidForm();
        fireEvent.click(screen.getByRole('button', { name: 'Create vote' }));

        expect(await screen.findByText('Vote page')).toBeInTheDocument();
        expect(
            JSON.parse(
                window.localStorage.getItem(organizerTokensStorageKey) ?? '{}',
            ),
        ).toEqual({
            organizerTokensByPollRef: {
                [pollId]: organizerToken,
            },
        });
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
                    organizerToken:
                        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
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
        fillValidForm();
        fireEvent.click(screen.getByRole('button', { name: 'Create vote' }));

        expect(
            await screen.findByText(
                'Failed to resolve the newly created vote link.',
            ),
        ).toBeInTheDocument();
        expect(screen.queryByText('Vote page')).not.toBeInTheDocument();
    });
});
