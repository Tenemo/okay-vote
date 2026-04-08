import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const browserVoteLocksStorageKey = 'okay-vote.browser-vote-locks';

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

    return Object.fromEntries(
        Object.entries(value).filter(
            ([pollRef, isLocked]) =>
                pollRef.trim().length > 0 && isLocked === true,
        ),
    ) as Record<string, true>;
};

export const loadVoteLocksState = (): VoteLocksState => {
    if (typeof window === 'undefined') {
        return createInitialVoteLocksState();
    }

    try {
        const persistedState = window.localStorage.getItem(
            browserVoteLocksStorageKey,
        );

        if (!persistedState) {
            return createInitialVoteLocksState();
        }

        const parsedState: unknown = JSON.parse(persistedState);

        if (
            !parsedState ||
            typeof parsedState !== 'object' ||
            Array.isArray(parsedState)
        ) {
            return createInitialVoteLocksState();
        }

        return {
            lockedPolls: normalizeLockedPolls(
                (parsedState as { lockedPolls?: unknown }).lockedPolls,
            ),
        };
    } catch {
        return createInitialVoteLocksState();
    }
};

export const persistVoteLocksState = (state: VoteLocksState): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(
            browserVoteLocksStorageKey,
            JSON.stringify(state),
        );
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
