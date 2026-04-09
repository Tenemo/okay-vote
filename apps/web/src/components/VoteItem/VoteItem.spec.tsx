import { fireEvent, render, screen } from '@testing-library/react';

import VoteItem from './VoteItem';

describe('VoteItem', () => {
    test('renders a semantic radio group for each choice', () => {
        render(
            <VoteItem
                choiceIndex={0}
                choiceName="Apples"
                onVote={vi.fn()}
                selectedScore={7}
            />,
        );

        expect(screen.getByRole('group', { name: 'Apples' })).toBeVisible();
        expect(screen.getAllByRole('radio')).toHaveLength(10);
        expect(screen.getByRole('radio', { name: '7' })).toBeChecked();
    });

    test('reports the selected score when a radio option is chosen', () => {
        const onVote = vi.fn();

        render(
            <VoteItem
                choiceIndex={0}
                choiceName="Apples"
                onVote={onVote}
                selectedScore={5}
            />,
        );

        fireEvent.click(screen.getByLabelText('8'));

        expect(onVote).toHaveBeenCalledWith('Apples', 8);
    });

    test('allows extreme choice labels to wrap instead of overflowing', () => {
        const longChoiceName =
            'LOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOONG';

        render(
            <VoteItem
                choiceIndex={0}
                choiceName={longChoiceName}
                onVote={vi.fn()}
                selectedScore={5}
            />,
        );

        expect(screen.getByText(longChoiceName)).toHaveClass(
            '[overflow-wrap:anywhere]',
        );
    });

    test('uses touch-friendly styling on score chips', () => {
        render(
            <VoteItem
                choiceIndex={0}
                choiceName="Apples"
                onVote={vi.fn()}
                selectedScore={5}
            />,
        );

        expect(screen.getByText('7', { selector: 'label' })).toHaveClass(
            'touch-manipulation',
            'select-none',
            '[-webkit-tap-highlight-color:transparent]',
        );
    });
});
