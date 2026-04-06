import { renderError } from './utils';

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
});
