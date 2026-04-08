import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import Root from './Root';

describe('Root', () => {
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
});
