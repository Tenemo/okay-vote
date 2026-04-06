import { describe, expect, test } from 'vitest';

import { normalizeApiBaseUrl } from './pollsApi';

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
