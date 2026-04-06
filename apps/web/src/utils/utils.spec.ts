import { isUuid, renderError } from './utils';

describe('renderError', () => {
    test('extracts message payloads from query errors', () => {
        expect(
            renderError({
                status: 400,
                data: {
                    message: 'Bad request.',
                },
            }),
        ).toBe('Bad request.');
    });

    test('falls back to serialized error text', () => {
        expect(
            renderError({
                message: 'Something failed.',
                name: 'Error',
            }),
        ).toBe('Something failed.');
    });

    test('detects UUID values', () => {
        expect(isUuid('123e4567-e89b-42d3-a456-426614174000')).toBe(true);
        expect(isUuid('best-fruit--aaaabbbb')).toBe(false);
    });
});
