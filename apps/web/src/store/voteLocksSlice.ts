import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
    loadPersistedRecord,
    normalizeTrimmedTrueRecord,
    persistRecord,
} from './persistedState';

export const voteLocksStorageKey = 'okay-vote.vote-locks';
export const legacyVoteLocksStorageKey = 'okay-vote.browser-vote-locks';

type VoteLocksState = {
    lockedPolls: Record<string, true>;
};

const createInitialVoteLocksState = (): VoteLocksState => ({
    lockedPolls: {},
});

export const loadVoteLocksState = (): VoteLocksState => {
    for (const storageKey of [voteLocksStorageKey, legacyVoteLocksStorageKey]) {
        const persistedState = loadPersistedRecord(storageKey);

        if (!persistedState) {
            continue;
        }

        if (!('lockedPolls' in persistedState)) {
            continue;
        }

        return {
            lockedPolls: normalizeTrimmedTrueRecord(persistedState.lockedPolls),
        };
    }

    return createInitialVoteLocksState();
};

export const persistVoteLocksState = (state: VoteLocksState): void =>
    persistRecord(voteLocksStorageKey, state);

const voteLocksSlice = createSlice({
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

export const { markPollAsVoted } = voteLocksSlice.actions;

export default voteLocksSlice.reducer;
