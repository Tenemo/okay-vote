import { fireEvent, screen, waitFor } from '@testing-library/react';

import PollCreationPage from './PollCreationPage';

import {
    fillValidPollCreationForm,
    getMetaContent,
    renderPollCreationPageWithRoutes,
} from './testUtils';

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

describe('PollCreationPage navigation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        mockedUseLazyGetPollQuery.mockReturnValue([vi.fn()] as never);
    });

    test('renders score-voting SEO metadata on the creation page', () => {
        mockedUseCreatePollMutation.mockReturnValue([
            vi.fn(),
            {
                isLoading: false,
                error: undefined,
            },
        ] as never);

        renderPollCreationPageWithRoutes(<PollCreationPage />);

        expect(document.title).toBe('Create a vote | okay.vote');
        expect(getMetaContent('meta[name="description"]')).toBe(
            'Create and share a 1-10 score vote in okay.vote, collect responses, and reveal results when you are ready.',
        );
        expect(getMetaContent('meta[property="og:title"]')).toBe(
            'Create a vote | okay.vote',
        );
        expect(getMetaContent('meta[property="og:image"]')).toBe(
            'https://okay.vote/social/okay-vote-og.png',
        );
        expect(
            screen.getByText(
                'Set up a simple 1-10 score vote, add the options people can score, and share the generated link once everything looks right.',
            ),
        ).toBeVisible();
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

        renderPollCreationPageWithRoutes(<PollCreationPage />);
        fillValidPollCreationForm();
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

        renderPollCreationPageWithRoutes(<PollCreationPage />);
        fillValidPollCreationForm();
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

        renderPollCreationPageWithRoutes(<PollCreationPage />);
        fillValidPollCreationForm();
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

        renderPollCreationPageWithRoutes(<PollCreationPage />);
        fillValidPollCreationForm();
        fireEvent.click(screen.getByRole('button', { name: 'Create vote' }));

        expect(
            await screen.findByText(
                'Failed to resolve the newly created vote link.',
            ),
        ).toBeInTheDocument();
        expect(screen.queryByText('Vote page')).not.toBeInTheDocument();
    });
});
