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
        <meta property="og:image" content="https://okay.vote/social/okay-vote-og.png" />
        <meta property="og:image:secure_url" content="https://okay.vote/social/okay-vote-og.png" />
        <meta property="og:image:alt" content="Generic alt" />
        <meta name="twitter:title" content="Generic title" />
        <meta name="twitter:description" content="Generic description" />
        <meta name="twitter:image" content="https://okay.vote/social/okay-vote-og.png" />
        <meta name="twitter:image:alt" content="Generic alt" />
        <title>okay.vote</title>
    </head>
    <body></body>
</html>`;

        const updatedHtml = applySeoHtmlMetadata(html, {
            canonicalUrl: 'https://okay.vote/votes/best-fruit',
            description: 'Vote on Best fruit.',
            imageAlt: 'Best fruit preview.',
            imageUrl: 'https://okay.vote/og/vote/best-fruit',
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
            '<meta property="og:image" content="https://okay.vote/og/vote/best-fruit" />',
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
            imageUrl: 'https://okay.vote/og/vote/best-fruit',
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
        expect(updatedHtml).toContain(
            '<meta name="twitter:image" content="https://okay.vote/og/vote/best-fruit" />',
        );
        expect(updatedHtml.indexOf('</head>')).toBeGreaterThan(
            updatedHtml.indexOf(
                '<meta property="og:title" content="Best fruit | okay.vote" />',
            ),
        );
    });

    test('replaces existing SEO tags literally when metadata contains dollar signs', () => {
        const html = `<!doctype html>
<html lang="en">
    <head>
        <meta name="description" content="Generic description" />
        <meta property="og:title" content="Generic title" />
        <title>okay.vote</title>
    </head>
    <body></body>
</html>`;

        const updatedHtml = applySeoHtmlMetadata(html, {
            canonicalUrl: 'https://okay.vote/votes/cash-$1',
            description: 'Compare $1, $&, and $9.',
            imageAlt: 'Cash $1 preview.',
            imageUrl: 'https://okay.vote/og/vote/cash-$1',
            pageTitle: 'Cash $1 vs $& | okay.vote',
        });

        expect(updatedHtml).toContain(
            '<title>Cash $1 vs $&amp; | okay.vote</title>',
        );
        expect(updatedHtml).toContain(
            '<meta name="description" content="Compare $1, $&amp;, and $9." />',
        );
        expect(updatedHtml).toContain(
            '<meta property="og:title" content="Cash $1 vs $&amp; | okay.vote" />',
        );
    });

    test('inserts missing SEO tags literally when metadata contains dollar signs', () => {
        const html = `<!doctype html>
<html lang="en">
    <head></head>
    <body></body>
</html>`;

        const updatedHtml = applySeoHtmlMetadata(html, {
            canonicalUrl: 'https://okay.vote/votes/cash-$1',
            description: 'Compare $1, $&, and $9.',
            imageAlt: 'Cash $1 preview.',
            imageUrl: 'https://okay.vote/og/vote/cash-$1',
            pageTitle: 'Cash $1 vs $& | okay.vote',
        });

        expect(updatedHtml).toContain(
            '<meta property="og:title" content="Cash $1 vs $&amp; | okay.vote" />',
        );
        expect(updatedHtml).toContain(
            '<meta name="twitter:description" content="Compare $1, $&amp;, and $9." />',
        );
    });
});
