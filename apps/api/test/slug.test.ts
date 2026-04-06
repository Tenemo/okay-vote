import {
    buildPollSlug,
    getPollSlugCandidates,
    MAX_POLL_SLUG_TITLE_LENGTH,
    normalizePollSlugTitleSegment,
} from 'utils/slug';

describe('normalizePollSlugTitleSegment', () => {
    test('slugifies ASCII titles', () => {
        expect(normalizePollSlugTitleSegment('Team lunch')).toBe('team-lunch');
    });

    test('transliterates Unicode titles to ASCII', () => {
        expect(normalizePollSlugTitleSegment('Crème brûlée')).toBe(
            'creme-brulee',
        );
    });

    test('removes punctuation-heavy noise', () => {
        expect(normalizePollSlugTitleSegment('***Hello, world!!!***')).toBe(
            'hello-world',
        );
    });

    test('falls back to vote for empty titles', () => {
        expect(normalizePollSlugTitleSegment('   ')).toBe('vote');
    });

    test('truncates long slugified titles without leaving edge hyphens', () => {
        const titleSegment = normalizePollSlugTitleSegment(
            'Alpha beta gamma delta epsilon zeta eta theta iota kappa lambda',
        );

        expect(titleSegment.length).toBeLessThanOrEqual(
            MAX_POLL_SLUG_TITLE_LENGTH,
        );
        expect(titleSegment).not.toMatch(/^-|-$|--/);
    });
});

describe('poll slug candidates', () => {
    test('builds the canonical title-and-suffix slug format', () => {
        expect(
            buildPollSlug(
                'Team lunch',
                '11111111-1111-4111-8111-1111aaaabbbb',
                8,
            ),
        ).toBe('team-lunch--aaaabbbb');
    });

    test('uses the configured suffix lengths in escalation order', () => {
        const compactPollId = '11111111-1111-4111-8111-1111aaaabbbb'.replaceAll(
            '-',
            '',
        );
        const candidates = getPollSlugCandidates(
            'Team lunch',
            '11111111-1111-4111-8111-1111aaaabbbb',
        );

        expect(candidates.map((candidate) => candidate.split('--')[1])).toEqual(
            [8, 12, 16, 20, 24, 32].map((suffixLength) =>
                compactPollId.slice(-suffixLength),
            ),
        );
    });

    test('supports collision escalation for duplicate titles', () => {
        const firstCandidates = getPollSlugCandidates(
            'Retro',
            '11111111-1111-4111-8111-1111aaaabbbb',
        );
        const secondCandidates = getPollSlugCandidates(
            'Retro',
            '22222222-2222-4222-8222-2222aaaabbbb',
        );

        expect(firstCandidates[0]).toBe(secondCandidates[0]);
        expect(firstCandidates[1]).not.toBe(secondCandidates[1]);
        expect(secondCandidates[1]).toBe('retro--2222aaaabbbb');
    });
});
