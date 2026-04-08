import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const organizerTokensStorageKey = 'okay-vote.organizer-tokens';

export type OrganizerTokensState = {
    organizerTokensByPollRef: Record<string, string>;
};

const createInitialOrganizerTokensState = (): OrganizerTokensState => ({
    organizerTokensByPollRef: {},
});

const normalizeOrganizerTokens = (value: unknown): Record<string, string> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    return Object.entries(value).reduce<Record<string, string>>(
        (normalizedOrganizerTokens, [pollRef, organizerToken]) => {
            const normalizedPollRef = pollRef.trim();
            const normalizedOrganizerToken =
                typeof organizerToken === 'string' ? organizerToken.trim() : '';

            if (!normalizedPollRef || !normalizedOrganizerToken) {
                return normalizedOrganizerTokens;
            }

            normalizedOrganizerTokens[normalizedPollRef] =
                normalizedOrganizerToken;

            return normalizedOrganizerTokens;
        },
        {},
    );
};

export const loadOrganizerTokensState = (): OrganizerTokensState => {
    if (typeof window === 'undefined') {
        return createInitialOrganizerTokensState();
    }

    try {
        const persistedState = window.localStorage.getItem(
            organizerTokensStorageKey,
        );

        if (!persistedState) {
            return createInitialOrganizerTokensState();
        }

        const parsedState: unknown = JSON.parse(persistedState);

        if (
            !parsedState ||
            typeof parsedState !== 'object' ||
            Array.isArray(parsedState)
        ) {
            return createInitialOrganizerTokensState();
        }

        return {
            organizerTokensByPollRef: normalizeOrganizerTokens(
                (parsedState as { organizerTokensByPollRef?: unknown })
                    .organizerTokensByPollRef,
            ),
        };
    } catch {
        return createInitialOrganizerTokensState();
    }
};

export const persistOrganizerTokensState = (
    state: OrganizerTokensState,
): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(
            organizerTokensStorageKey,
            JSON.stringify(state),
        );
    } catch {
        // Ignore persistence failures so organizer actions still work in-memory.
    }
};

export const organizerTokensSlice = createSlice({
    name: 'organizerTokens',
    initialState: createInitialOrganizerTokensState(),
    reducers: {
        storeOrganizerToken: (
            state,
            action: PayloadAction<{
                organizerToken: string;
                pollRefs: string[];
            }>,
        ) => {
            const normalizedOrganizerToken =
                action.payload.organizerToken.trim();

            if (!normalizedOrganizerToken) {
                return;
            }

            for (const pollRef of action.payload.pollRefs) {
                const normalizedPollRef = pollRef.trim();

                if (!normalizedPollRef) {
                    continue;
                }

                state.organizerTokensByPollRef[normalizedPollRef] =
                    normalizedOrganizerToken;
            }
        },
    },
});

export const selectOrganizerToken = (
    state: { organizerTokens: OrganizerTokensState },
    pollRefs: string[],
): string | null => {
    for (const pollRef of pollRefs) {
        const normalizedPollRef = pollRef.trim();

        if (!normalizedPollRef) {
            continue;
        }

        const organizerToken =
            state.organizerTokens.organizerTokensByPollRef[normalizedPollRef];

        if (organizerToken) {
            return organizerToken;
        }
    }

    return null;
};

export const { storeOrganizerToken } = organizerTokensSlice.actions;

export default organizerTokensSlice.reducer;
