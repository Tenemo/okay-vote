import { render, screen } from '@testing-library/react';

import { Alert } from './alert';

describe('Alert', () => {
    test('does not announce passive alerts by default', () => {
        render(<Alert>Passive message</Alert>);

        const alert = screen.getByText('Passive message');

        expect(alert).not.toHaveAttribute('role');
        expect(alert).not.toHaveAttribute('aria-live');
    });

    test('announces polite alerts as status messages', () => {
        render(<Alert announcement="polite">Saved</Alert>);

        expect(screen.getByRole('status')).toHaveAttribute(
            'aria-live',
            'polite',
        );
    });

    test('announces assertive alerts as alerts', () => {
        render(<Alert announcement="assertive">Failed</Alert>);

        expect(screen.getByRole('alert')).toHaveAttribute(
            'aria-live',
            'assertive',
        );
    });
});
