import { render, screen } from '@testing-library/react';

import { Spinner } from './spinner';

describe('Spinner', () => {
    test('announces a default loading label for standalone usage', () => {
        render(<Spinner />);

        expect(
            screen.getByRole('status', { name: 'Loading' }),
        ).toBeInTheDocument();
    });

    test('can be rendered as decorative when nested inside another control', () => {
        render(<Spinner label={null} />);

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
});
