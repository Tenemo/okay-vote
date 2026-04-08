import {
    buildPollOgImageAlt,
    buildPollOgImagePath,
    buildPollSeoDescription,
    buildSiteUrl,
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

    test('builds site URLs against the production origin', () => {
        expect(buildSiteUrl('/votes/best-fruit?ref=share')).toBe(
            'https://okay.vote/votes/best-fruit?ref=share',
        );
    });

    test('builds the open-poll image path and alt text', () => {
        expect(buildPollOgImagePath('best-fruit--aaaabbbb')).toBe(
            '/og/vote/best-fruit--aaaabbbb',
        );
        expect(buildPollOgImageAlt('Best fruit')).toBe(
            'Preview image for Best fruit on okay.vote.',
        );
    });

    test('builds the ended-poll image path and alt text', () => {
        expect(
            buildPollOgImagePath('best-fruit--aaaabbbb', {
                endedAt: '2026-04-08T10:15:00.000Z',
            }),
        ).toBe('/og/vote/best-fruit--aaaabbbb?v=2026-04-08T10%3A15%3A00.000Z');
        expect(
            buildPollOgImageAlt('Best fruit', {
                isEnded: true,
            }),
        ).toBe('Final results preview for Best fruit on okay.vote.');
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
