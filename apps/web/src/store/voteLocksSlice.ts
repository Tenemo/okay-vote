import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const voteLocksStorageKey = 'okay-vote.vote-locks';
export const legacyVoteLocksStorageKey = 'okay-vote.browser-vote-locks';

export type VoteLocksState = {
    lockedPolls: Record<string, true>;
};

const createInitialVoteLocksState = (): VoteLocksState => ({
    lockedPolls: {},
});

const normalizeLockedPolls = (value: unknown): Record<string, true> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    return Object.entries(value).reduce<Record<string, true>>(
        (normalizedLockedPolls, [pollRef, isLocked]) => {
            const normalizedPollRef = pollRef.trim();

            if (!normalizedPollRef || isLocked !== true) {
                return normalizedLockedPolls;
            }

            normalizedLockedPolls[normalizedPollRef] = true;

            return normalizedLockedPolls;
        },
        {},
    );
};

export const loadVoteLocksState = (): VoteLocksState => {
    if (typeof window === 'undefined') {
        return createInitialVoteLocksState();
    }

    for (const storageKey of [voteLocksStorageKey, legacyVoteLocksStorageKey]) {
        try {
            const persistedState = window.localStorage.getItem(storageKey);

            if (!persistedState) {
                continue;
            }

            const parsedState: unknown = JSON.parse(persistedState);

            if (
                !parsedState ||
                typeof parsedState !== 'object' ||
                Array.isArray(parsedState)
            ) {
                continue;
            }

            const { lockedPolls } = parsedState as { lockedPolls?: unknown };

            if (
                typeof lockedPolls === 'undefined' ||
                lockedPolls === null ||
                typeof lockedPolls !== 'object' ||
                Array.isArray(lockedPolls)
            ) {
                continue;
            }

            return {
                lockedPolls: normalizeLockedPolls(lockedPolls),
            };
        } catch {
            continue;
        }
    }

    return createInitialVoteLocksState();
};

export const persistVoteLocksState = (state: VoteLocksState): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(voteLocksStorageKey, JSON.stringify(state));
    } catch {
        // Ignore persistence failures so voting still works if storage is unavailable.
    }
};

export const voteLocksSlice = createSlice({
    name: 'voteLocks',
    initialState: createInitialVoteLocksState(),
    reducers: {
        markPollAsVoted: (
            state,
            action: PayloadAction<{ pollRef: string }>,
        ) => {
            const normalizedPollRef = action.payload.pollRef.trim();

            if (!normalizedPollRef) {
                return;
            }

            state.lockedPolls[normalizedPollRef] = true;
        },
        resetVoteLocks: () => createInitialVoteLocksState(),
    },
});

export const selectIsPollLocked = (
    state: { voteLocks: VoteLocksState },
    pollRef: string,
): boolean => {
    const normalizedPollRef = pollRef.trim();

    return (
        normalizedPollRef.length > 0 &&
        state.voteLocks.lockedPolls[normalizedPollRef] === true
    );
};

export const { markPollAsVoted, resetVoteLocks } = voteLocksSlice.actions;

export default voteLocksSlice.reducer;
