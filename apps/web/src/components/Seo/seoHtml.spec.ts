import { applySeoHtmlMetadata } from './seoHtml';

describe('applySeoHtmlMetadata', () => {
    test('replaces the existing vote share metadata in the HTML head', () => {
        const html = `<!doctype html>
<html lang="en">
    <head>
        <meta name="description" content="Generic description" />
        <link rel="canonical" href="https://okay.vote/" />
        <meta property="og:title" content="Generic title" />
        <meta property="og:description" content="Generic description" />
        <meta property="og:url" content="https://okay.vote/" />
        <meta property="og:image:alt" content="Generic alt" />
        <meta name="twitter:title" content="Generic title" />
        <meta name="twitter:description" content="Generic description" />
        <meta name="twitter:image:alt" content="Generic alt" />
        <title>okay.vote</title>
    </head>
    <body></body>
</html>`;

        const updatedHtml = applySeoHtmlMetadata(html, {
            canonicalUrl: 'https://okay.vote/votes/best-fruit',
            description: 'Vote on Best fruit.',
            imageAlt: 'Best fruit preview.',
            pageTitle: 'Best fruit | okay.vote',
        });

        expect(updatedHtml).toContain('<title>Best fruit | okay.vote</title>');
        expect(updatedHtml).toContain(
            '<meta name="description" content="Vote on Best fruit." />',
        );
        expect(updatedHtml).toContain(
            '<link rel="canonical" href="https://okay.vote/votes/best-fruit" />',
        );
        expect(updatedHtml).toContain(
            '<meta property="og:url" content="https://okay.vote/votes/best-fruit" />',
        );
        expect(updatedHtml).toContain(
            '<meta name="twitter:image:alt" content="Best fruit preview." />',
        );
        expect(updatedHtml).not.toContain('Generic description');
    });

    test('inserts missing vote share metadata before the closing head tag', () => {
        const html = `<!doctype html>
<html lang="en">
    <head>
        <title>okay.vote</title>
    </head>
    <body></body>
</html>`;

        const updatedHtml = applySeoHtmlMetadata(html, {
            canonicalUrl: 'https://okay.vote/votes/best-fruit',
            description: 'Vote on Best fruit.',
            imageAlt: 'Best fruit preview.',
            pageTitle: 'Best fruit | okay.vote',
        });

        expect(updatedHtml).toContain(
            '<meta property="og:title" content="Best fruit | okay.vote" />',
        );
        expect(updatedHtml).toContain(
            '<meta name="description" content="Vote on Best fruit." />',
        );
        expect(updatedHtml).toContain(
            '<link rel="canonical" href="https://okay.vote/votes/best-fruit" />',
        );
        expect(updatedHtml.indexOf('</head>')).toBeGreaterThan(
            updatedHtml.indexOf(
                '<meta property="og:title" content="Best fruit | okay.vote" />',
            ),
        );
    });
});
