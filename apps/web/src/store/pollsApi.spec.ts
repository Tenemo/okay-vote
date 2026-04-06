import { describe, expect, test } from 'vitest';

import {
    normalizeApiBaseUrl,
    resolveApiBaseUrl,
    shouldUseProxyApiBaseUrl,
} from './pollsApi';

describe('normalizeApiBaseUrl', () => {
    test('preserves an origin-only base URL', () => {
        expect(normalizeApiBaseUrl('https://api.example.com')).toBe(
            'https://api.example.com',
        );
    });

    test('strips trailing slashes', () => {
        expect(normalizeApiBaseUrl('https://api.example.com///')).toBe(
            'https://api.example.com',
        );
    });

    test('strips a trailing api path segment', () => {
        expect(normalizeApiBaseUrl('https://api.example.com/api')).toBe(
            'https://api.example.com',
        );
        expect(normalizeApiBaseUrl('https://api.example.com/api/')).toBe(
            'https://api.example.com',
        );
    });

    test('collapses a root api path back to the proxy root', () => {
        expect(normalizeApiBaseUrl('/api')).toBe('');
        expect(normalizeApiBaseUrl('/api/')).toBe('');
    });
});

describe('shouldUseProxyApiBaseUrl', () => {
    test('uses the proxy on the production site domain', () => {
        expect(shouldUseProxyApiBaseUrl('okay.vote')).toBe(true);
        expect(shouldUseProxyApiBaseUrl('www.okay.vote')).toBe(true);
    });

    test('uses the proxy on Netlify deploy previews', () => {
        expect(
            shouldUseProxyApiBaseUrl('deploy-preview-2--okay-vote.netlify.app'),
        ).toBe(true);
    });

    test('does not force the proxy for unrelated custom hosts', () => {
        expect(shouldUseProxyApiBaseUrl('app.example.com')).toBe(false);
    });
});

describe('resolveApiBaseUrl', () => {
    test('defaults to the proxy when no explicit API base URL is configured', () => {
        expect(resolveApiBaseUrl(undefined, 'localhost')).toBe('/');
    });

    test('keeps an explicit API origin for non-proxy hosts', () => {
        expect(
            resolveApiBaseUrl('https://api.example.com/api', 'app.example.com'),
        ).toBe('https://api.example.com');
    });

    test('ignores an explicit API origin on Netlify previews and relies on the proxy instead', () => {
        expect(
            resolveApiBaseUrl(
                'https://api.okay.vote',
                'deploy-preview-2--okay-vote.netlify.app',
            ),
        ).toBe('/');
    });

    test('ignores an explicit API origin on the production site and relies on the proxy instead', () => {
        expect(resolveApiBaseUrl('https://api.okay.vote', 'okay.vote')).toBe(
            '/',
        );
    });
});
