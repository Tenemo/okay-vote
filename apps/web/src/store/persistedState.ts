const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
    Boolean(value && typeof value === 'object' && !Array.isArray(value));

export const loadPersistedRecord = (
    storageKey: string,
): Record<string, unknown> | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const persistedState = window.localStorage.getItem(storageKey);

        if (!persistedState) {
            return null;
        }

        const parsedState: unknown = JSON.parse(persistedState);

        return isPlainRecord(parsedState) ? parsedState : null;
    } catch {
        return null;
    }
};

export const persistRecord = (storageKey: string, value: unknown): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
        // Ignore persistence failures so the app still works in-memory.
    }
};

export const normalizeTrimmedStringRecord = (
    value: unknown,
): Record<string, string> => {
    if (!isPlainRecord(value)) {
        return {};
    }

    return Object.entries(value).reduce<Record<string, string>>(
        (normalizedValues, [key, recordValue]) => {
            const normalizedKey = key.trim();
            const normalizedValue =
                typeof recordValue === 'string' ? recordValue.trim() : '';

            if (!normalizedKey || !normalizedValue) {
                return normalizedValues;
            }

            normalizedValues[normalizedKey] = normalizedValue;

            return normalizedValues;
        },
        {},
    );
};

export const normalizeTrimmedTrueRecord = (
    value: unknown,
): Record<string, true> => {
    if (!isPlainRecord(value)) {
        return {};
    }

    return Object.entries(value).reduce<Record<string, true>>(
        (normalizedValues, [key, recordValue]) => {
            const normalizedKey = key.trim();

            if (!normalizedKey || recordValue !== true) {
                return normalizedValues;
            }

            normalizedValues[normalizedKey] = true;

            return normalizedValues;
        },
        {},
    );
};
