import { buildVoteOgImageSvg } from '../../seo/voteOgImage';

const RESULT_ROW_START_MARKUP = '<g transform="translate(776';

const findResultRowEnd = (svg: string, rowStart: number): number => {
    let depth = 0;
    let position = rowStart;

    while (position < svg.length) {
        const nextOpen = svg.indexOf('<g', position);
        const nextClose = svg.indexOf('</g>', position);

        if (nextClose === -1) {
            break;
        }

        if (nextOpen !== -1 && nextOpen < nextClose) {
            depth += 1;
            position = nextOpen + '<g'.length;
            continue;
        }

        depth -= 1;
        position = nextClose + '</g>'.length;

        if (depth === 0) {
            return position;
        }
    }

    throw new Error('Expected to find the end of the result row.');
};

const getResultRowsMarkup = (svg: string): string[] => {
    const rows: string[] = [];
    let position = 0;

    while (position < svg.length) {
        const rowStart = svg.indexOf(RESULT_ROW_START_MARKUP, position);

        if (rowStart === -1) {
            break;
        }

        const rowEnd = findResultRowEnd(svg, rowStart);
        rows.push(svg.slice(rowStart, rowEnd));
        position = rowEnd;
    }

    return rows;
};

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

        expect(svg).toContain('Long bong Lon...');
        expect(svg).not.toContain('Long bong Long...');
    });

    test('truncates visually wide all-caps choice labels sooner in the preview panel', () => {
        const svg = buildVoteOgImageSvg({
            choiceNames: ['LOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOONG', 'Short'],
            pollName: 'Best fruit for breakfast',
        });

        expect(svg).toContain('LOOOOOOOOO...');
        expect(svg).not.toContain('LOOOOOOOOOOOOOO...');
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

    test('does not ellipsize title lines when the title fits exactly', () => {
        const svg = buildVoteOgImageSvg({
            choiceNames: ['Apples', 'Bananas', 'Pears'],
            pollName: '1234567890abcdef ghijklmnopqrstuv wxyz123456789012',
        });

        expect(svg).toContain('1234567890abcdef');
        expect(svg).toContain('ghijklmnopqrstuv');
        expect(svg).toContain('wxyz123456789012');
        expect(svg).not.toContain('wxyz123456789...');
    });

    test('ellipsizes a single long title token instead of letting it overflow', () => {
        const svg = buildVoteOgImageSvg({
            choiceNames: ['Apples', 'Bananas', 'Pears'],
            pollName: 'favorite-favorite-favorite-favor--6fa446f6',
        });

        expect(svg).toContain('favorite-favo...');
    });

    test('ellipsizes a long word even when it starts a later title line', () => {
        const svg = buildVoteOgImageSvg({
            choiceNames: ['Apples', 'Bananas', 'Pears'],
            pollName:
                'Best favorite-favorite-favorite-favor--6fa446f6 breakfast',
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

    test('uses podium icons and outlines only for the top three results', () => {
        const svg = buildVoteOgImageSvg({
            choiceNames: ['Apples', 'Bananas', 'Pears', 'Dates'],
            isEnded: true,
            pollName: 'Best fruit for breakfast',
            results: {
                Apples: 8.94,
                Bananas: 9.5,
                Dates: 6.4,
                Pears: 7.12,
            },
        });

        const resultRows = getResultRowsMarkup(svg);
        const [firstRow, secondRow, thirdRow, fourthRow] = resultRows;

        expect(resultRows).toHaveLength(4);

        expect(firstRow).toContain('stroke="#d6a72c"');
        expect(firstRow).toContain('M14 11h18v8');
        expect(secondRow).toContain('stroke="#bfc5ca"');
        expect(secondRow).toContain('>2</text>');
        expect(thirdRow).toContain('stroke="#a9683d"');
        expect(thirdRow).toContain('>3</text>');
        expect(fourthRow).toContain('stroke="#2c2c2c"');
        expect(fourthRow).toContain('>4</text>');
        expect(fourthRow).not.toContain('M14 11h18v8');
        expect(fourthRow).not.toContain('stroke="#d6a72c"');
        expect(fourthRow).not.toContain('stroke="#bfc5ca"');
        expect(fourthRow).not.toContain('stroke="#a9683d"');
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
