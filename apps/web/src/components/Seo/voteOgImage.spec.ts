import { buildVoteOgImageSvg } from './voteOgImage';

describe('buildVoteOgImageSvg', () => {
    test('renders the poll title and first choices into the SVG card', () => {
        const svg = buildVoteOgImageSvg({
            choiceNames: ['Apples', 'Bananas', 'Pears'],
            pollName: 'Best fruit for breakfast',
        });

        expect(svg).toContain('Best fruit for');
        expect(svg).toContain('breakfast');
        expect(svg).toContain('Apples');
        expect(svg).toContain('Bananas');
        expect(svg).toContain('3 choices');
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
});
