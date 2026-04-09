import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Seo from './Seo';

const initialHeadMarkup = document.head.innerHTML;

describe('Seo', () => {
    afterEach(() => {
        document.head.innerHTML = initialHeadMarkup;
    });

    test('updates existing head tags in place without leaving duplicates', () => {
        document.head.innerHTML = `
            <title>okay.vote | 1-10 score voting app</title>
            <meta name="description" content="fallback description" />
            <meta name="description" content="stale description" />
            <link rel="canonical" href="https://okay.vote/" />
            <link rel="canonical" href="https://okay.vote/stale" />
            <meta property="og:url" content="https://okay.vote/" />
            <meta property="og:url" content="https://okay.vote/stale" />
            <meta property="og:title" content="fallback title" />
            <meta name="twitter:title" content="fallback title" />
        `;

        render(
            <MemoryRouter
                initialEntries={['/votes/best-fruit--aaaabbbb?view=all']}
            >
                <Seo
                    description="Score options from 1 to 10."
                    title="Best fruit"
                />
            </MemoryRouter>,
        );

        expect(document.title).toBe('Best fruit');
        expect(
            document.head.querySelectorAll('meta[name="description"]'),
        ).toHaveLength(1);
        expect(
            document.head.querySelectorAll('link[rel="canonical"]'),
        ).toHaveLength(1);
        expect(
            document.head.querySelectorAll('meta[property="og:url"]'),
        ).toHaveLength(1);
        expect(
            document.head
                .querySelector('meta[name="description"]')
                ?.getAttribute('content'),
        ).toBe('Score options from 1 to 10.');
        expect(
            document.head
                .querySelector('link[rel="canonical"]')
                ?.getAttribute('href'),
        ).toBe('https://okay.vote/votes/best-fruit--aaaabbbb?view=all');
        expect(
            document.head
                .querySelector('meta[property="og:url"]')
                ?.getAttribute('content'),
        ).toBe('https://okay.vote/votes/best-fruit--aaaabbbb?view=all');
        expect(
            document.head
                .querySelector('meta[property="og:title"]')
                ?.getAttribute('content'),
        ).toBe('Best fruit');
        expect(
            document.head
                .querySelector('meta[name="twitter:title"]')
                ?.getAttribute('content'),
        ).toBe('Best fruit');
    });
});
