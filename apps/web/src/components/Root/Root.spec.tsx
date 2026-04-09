import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import Root from './Root';

describe('Root', () => {
    test('does not leave the main content container focusable by default', () => {
        window.history.replaceState({}, '', '/');

        render(<Root />);

        expect(screen.getByRole('main')).not.toHaveAttribute('tabindex');
    });

    test('moves focus to the main content when the skip link is activated', async () => {
        window.history.replaceState({}, '', '/');

        render(<Root />);

        const skipLink = screen.getByRole('link', {
            name: 'Skip to main content',
        });
        const main = screen.getByRole('main');

        fireEvent.click(skipLink);

        await waitFor(() => {
            expect(main).toHaveFocus();
        });
    });

    test('removes temporary main content focusability after focus leaves', async () => {
        window.history.replaceState({}, '', '/');

        render(<Root />);

        const skipLink = screen.getByRole('link', {
            name: 'Skip to main content',
        });
        const main = screen.getByRole('main');
        const githubLink = screen.getByRole('link', {
            name: 'Open the okay.vote repository on GitHub',
        });

        fireEvent.click(skipLink);

        await waitFor(() => {
            expect(main).toHaveFocus();
        });

        expect(main).toHaveAttribute('tabindex', '-1');

        fireEvent.focusIn(githubLink);

        expect(main).not.toHaveAttribute('tabindex');
    });

    test('moves focus to the main content even without requestAnimationFrame', async () => {
        const originalRequestAnimationFrame = window.requestAnimationFrame;

        window.history.replaceState({}, '', '/');

        Reflect.deleteProperty(window, 'requestAnimationFrame');

        try {
            render(<Root />);

            const skipLink = screen.getByRole('link', {
                name: 'Skip to main content',
            });
            const main = screen.getByRole('main');

            fireEvent.click(skipLink);

            await waitFor(() => {
                expect(main).toHaveFocus();
            });
        } finally {
            Object.defineProperty(window, 'requestAnimationFrame', {
                configurable: true,
                value: originalRequestAnimationFrame,
                writable: true,
            });
        }
    });
});
