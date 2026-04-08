import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PollCreationPage from './PollCreationPage';

import {
    fillValidPollCreationForm,
    renderPollCreationPageWithRoutes,
} from './testUtils';

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

describe('PollCreationPage form', () => {
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

        renderPollCreationPageWithRoutes(<PollCreationPage />);

        const createButton = screen.getByRole('button', {
            name: 'Creating vote',
        });

        expect(createButton).toBeDisabled();
        expect(createButton).toHaveAttribute('aria-busy', 'true');
    });

    test('keeps the create button loading after submit until redirect starts', () => {
        const createPoll = vi.fn(() => ({
            unwrap: () => new Promise<never>(() => {}),
        }));

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

        const createButton = screen.getByRole('button', {
            name: 'Creating vote',
        });

        expect(createPoll).toHaveBeenCalledTimes(1);
        expect(createButton).toBeDisabled();
        expect(createButton).toHaveAttribute('aria-busy', 'true');
    });

    test('submits the create form when enter is pressed from a text input', async () => {
        const user = userEvent.setup();
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

        mockedUseCreatePollMutation.mockReturnValue([
            createPoll,
            {
                isLoading: false,
                error: undefined,
            },
        ] as never);

        renderPollCreationPageWithRoutes(<PollCreationPage />);
        fillValidPollCreationForm();
        await user.click(screen.getByLabelText(/Vote name/i));
        await user.keyboard('{Enter}');

        await waitFor(() => {
            expect(createPoll).toHaveBeenCalledWith({
                pollName: 'Team lunch',
                choices: ['Pizza', 'Ramen'],
            });
        });
        expect(await screen.findByText('Vote page')).toBeInTheDocument();
    });

    test('adds a choice when enter is pressed in the choice input', async () => {
        const user = userEvent.setup();
        const createPoll = vi.fn();

        mockedUseCreatePollMutation.mockReturnValue([
            createPoll,
            {
                isLoading: false,
                error: undefined,
            },
        ] as never);

        renderPollCreationPageWithRoutes(<PollCreationPage />);

        const choiceInput = screen.getByLabelText('Choice to vote for');

        await user.type(choiceInput, ' Pizza ');
        await user.keyboard('{Enter}');

        expect(screen.getByText('Pizza')).toBeInTheDocument();
        expect(choiceInput).toHaveValue('');
        expect(createPoll).not.toHaveBeenCalled();
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

        renderPollCreationPageWithRoutes(<PollCreationPage />);
        fillValidPollCreationForm();
        fireEvent.click(screen.getByRole('button', { name: 'Create vote' }));

        expect(
            await screen.findByText('Unable to create vote.'),
        ).toBeInTheDocument();
    });

    test('truncates long choice rows without dropping the full value', () => {
        mockedUseCreatePollMutation.mockReturnValue([
            vi.fn(),
            {
                isLoading: false,
                error: undefined,
            },
        ] as never);

        renderPollCreationPageWithRoutes(<PollCreationPage />);

        fireEvent.change(screen.getByLabelText('Choice to vote for'), {
            target: {
                value: 'LOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOONG',
            },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Add new choice' }));
        fireEvent.change(screen.getByLabelText('Choice to vote for'), {
            target: { value: 'Short' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Add new choice' }));

        const longChoiceText = screen.getByText(
            'LOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOONG',
        );

        expect(longChoiceText).toHaveAttribute(
            'title',
            'LOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOONG',
        );
        expect(longChoiceText.className).toContain('truncate');
        expect(longChoiceText.className).toContain('min-w-0');
    });
});
