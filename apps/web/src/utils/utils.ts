import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const renderError = (
    error: FetchBaseQueryError | SerializedError | undefined,
): string => {
    if (!error) {
        return 'An unknown error occurred.';
    }

    if ('data' in error) {
        if (typeof error.data === 'string') {
            return error.data;
        }

        if (
            error.data &&
            typeof error.data === 'object' &&
            'message' in error.data &&
            typeof error.data.message === 'string'
        ) {
            return error.data.message;
        }
    }

    if ('error' in error && typeof error.error === 'string') {
        return error.error;
    }

    if ('message' in error && typeof error.message === 'string') {
        return error.message;
    }

    return 'An unknown error occurred.';
};

export const isUuid = (value: string): boolean => uuidRegex.test(value);
