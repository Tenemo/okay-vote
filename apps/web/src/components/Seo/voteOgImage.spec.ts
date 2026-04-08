import { buildVoteOgImageSvg } from './voteOgImage';

describe('buildVoteOgImageSvg', () => {
    test('renders the open poll title and first choices into the SVG card', () => {
        const svg = buildVoteOgImageSvg({
            choiceNames: ['Apples', 'Bananas', 'Pears'],
            pollName: 'Best fruit for breakfast',
        });

        expect(svg).toContain('Best fruit for');
        expect(svg).toContain('breakfast');
        expect(svg).toContain('1-10 score vote');
        expect(svg).toContain('Choices');
        expect(svg).toContain('Apples');
        expect(svg).toContain('Bananas');
        expect(svg).toContain('3 choices');
        expect(svg).not.toContain('Collect scores and share the link');
    });

    test('escapes XML and summarizes extra choices', () => {
        const svg = buildVoteOgImageSvg({
            choiceNames: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'],
            pollName: 'Fish & Chips <Friday>',
        });

        expect(svg).toContain('Fish &amp; Chips');
        expect(svg).toContain('&lt;Friday&gt;');
        expect(svg).toContain('+2 more');
    });

    test('uses tighter truncation for long choice labels in the preview panel', () => {
        const svg = buildVoteOgImageSvg({
            choiceNames: ['Long bong Long bong Long bong Long bong', 'Short'],
            pollName: 'Best fruit for breakfast',
        });

        expect(svg).toContain('Long bong Long b...');
        expect(svg).not.toContain('Long bong Long bong...');
    });

    test('wraps longer vote titles before they collide with the choices panel', () => {
        const svg = buildVoteOgImageSvg({
            choiceNames: ['Matematyka', 'Biologia', 'Chemia'],
            pollName: 'Ulubiony przedmiot?',
        });

        expect(svg).toContain('Ulubiony');
        expect(svg).toContain('przedmiot?');
    });

    test('ellipsizes the last visible title line when more words remain', () => {
        const svg = buildVoteOgImageSvg({
            choiceNames: ['Apples', 'Bananas', 'Pears'],
            pollName: 'favorite favorite favorite favorite favorite',
        });

        expect(svg).toContain('favorite...');
    });

    test('ellipsizes a single long title token instead of letting it overflow', () => {
        const svg = buildVoteOgImageSvg({
            choiceNames: ['Apples', 'Bananas', 'Pears'],
            pollName: 'favorite-favorite-favorite-favor--6fa446f6',
        });

        expect(svg).toContain('favorite-favo...');
    });

    test('renders final results for ended polls in score order', () => {
        const svg = buildVoteOgImageSvg({
            choiceNames: ['Apples', 'Bananas', 'Pears'],
            isEnded: true,
            pollName: 'Best fruit for breakfast',
            results: {
                Bananas: 9.5,
                Apples: 8.94,
                Pears: 7.12,
            },
        });

        expect(svg).toContain('Final results');
        expect(svg).toContain('Results');
        expect(svg).toContain('Bananas');
        expect(svg).not.toContain('9.50');
        expect(svg).not.toContain('8.94');
        expect(svg.indexOf('Bananas')).toBeLessThan(svg.indexOf('Apples'));
        expect(svg.indexOf('Apples')).toBeLessThan(svg.indexOf('Pears'));
    });

    test('renders a clear empty state when an ended poll has no results', () => {
        const svg = buildVoteOgImageSvg({
            choiceNames: ['Apples', 'Bananas'],
            isEnded: true,
            pollName: 'Best fruit for breakfast',
            results: {},
        });

        expect(svg).toContain('No submitted scores');
        expect(svg).toContain('2 choices were available.');
    });
});
