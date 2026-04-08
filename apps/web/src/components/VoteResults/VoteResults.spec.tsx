import { render, screen, within } from '@testing-library/react';

import VoteResults from './VoteResults';

describe('VoteResults', () => {
    test('sorts results by score and renders winner and runner-up icons', () => {
        render(
            <VoteResults
                results={{
                    Apples: 5.1,
                    Bananas: 7.2,
                    Cherries: 6.4,
                }}
            />,
        );

        const items = screen.getAllByRole('listitem');

        expect(within(items[0]).getByText('Bananas')).toBeInTheDocument();
        expect(within(items[1]).getByText('Cherries')).toBeInTheDocument();
        expect(within(items[2]).getByText('Apples')).toBeInTheDocument();
        expect(screen.getByLabelText('Winner')).toBeInTheDocument();
        expect(screen.getByLabelText('Runner-up')).toBeInTheDocument();
        expect(screen.getByLabelText('Third place')).toBeInTheDocument();
    });

    test('renders a clear empty state when no results are available', () => {
        render(<VoteResults results={{}} />);

        expect(
            screen.getByText('No votes were submitted before this poll ended.'),
        ).toBeInTheDocument();
        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });
});
