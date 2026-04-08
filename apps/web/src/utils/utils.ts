import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { UUID_REGEX } from '@okay-vote/contracts';

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

export const isUuid = (value: string): boolean => UUID_REGEX.test(value);
