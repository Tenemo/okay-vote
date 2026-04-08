import {
    buildPollSeoDescription,
    buildSeoTitle,
    DEFAULT_SEO_TITLE,
} from './seoMetadata';

describe('seoMetadata', () => {
    test('builds a site-branded SEO title when a page title is provided', () => {
        expect(buildSeoTitle('Best fruit')).toBe('Best fruit | okay.vote');
    });

    test('falls back to the default SEO title when no page title is provided', () => {
        expect(buildSeoTitle()).toBe(DEFAULT_SEO_TITLE);
    });

    test('builds the open-poll SEO description', () => {
        expect(
            buildPollSeoDescription({
                isEnded: false,
                pollName: 'Best fruit',
            }),
        ).toBe(
            'Score every option in Best fruit from 1 to 10 with the okay.vote app.',
        );
    });

    test('builds the ended-poll SEO description', () => {
        expect(
            buildPollSeoDescription({
                isEnded: true,
                pollName: 'Best fruit',
            }),
        ).toBe(
            'Review the final 1-10 score voting results for Best fruit in okay.vote.',
        );
    });
});
