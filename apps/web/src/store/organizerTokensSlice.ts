import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
    loadPersistedRecord,
    normalizeTrimmedStringRecord,
    persistRecord,
} from './persistedState';

// Organizer access is intentionally tied to the app on the creating device.
export const organizerTokensStorageKey = 'okay-vote.organizer-tokens';

type OrganizerTokensState = {
    organizerTokensByPollRef: Record<string, string>;
};

const createInitialOrganizerTokensState = (): OrganizerTokensState => ({
    organizerTokensByPollRef: {},
});

export const loadOrganizerTokensState = (): OrganizerTokensState => {
    const persistedState = loadPersistedRecord(organizerTokensStorageKey);

    if (!persistedState) {
        return createInitialOrganizerTokensState();
    }

    return {
        organizerTokensByPollRef: normalizeTrimmedStringRecord(
            persistedState.organizerTokensByPollRef,
        ),
    };
};

export const persistOrganizerTokensState = (
    state: OrganizerTokensState,
): void => persistRecord(organizerTokensStorageKey, state);

const organizerTokensSlice = createSlice({
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
