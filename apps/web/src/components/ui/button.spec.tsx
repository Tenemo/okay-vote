import { render, screen } from '@testing-library/react';

import { Button } from './button';

describe('Button', () => {
    test('defaults to button type to avoid accidental form submission', () => {
        render(<Button>Click me</Button>);

        expect(
            screen.getByRole('button', { name: 'Click me' }),
        ).toHaveAttribute('type', 'button');
    });

    test('preserves an explicit submit type when requested', () => {
        render(<Button type="submit">Submit me</Button>);

        expect(
            screen.getByRole('button', { name: 'Submit me' }),
        ).toHaveAttribute('type', 'submit');
    });
});
