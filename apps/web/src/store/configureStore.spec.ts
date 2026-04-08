import { describe, expect, test } from 'vitest';

import { createAppStore } from './configureStore';
import {
    browserVoteLocksStorageKey,
    markPollAsVoted,
    selectIsPollLocked,
} from './voteLocksSlice';

describe('createAppStore', () => {
    test('persists trimmed browser vote locks to local storage', () => {
        window.localStorage.clear();

        const store = createAppStore();

        store.dispatch(markPollAsVoted({ pollRef: ' poll-123 ' }));

        expect(
            JSON.parse(
                window.localStorage.getItem(browserVoteLocksStorageKey) ?? '{}',
            ),
        ).toEqual({
            lockedPolls: {
                'poll-123': true,
            },
        });
    });

    test('rehydrates persisted browser vote locks into Redux on a new store', () => {
        window.localStorage.clear();
        window.localStorage.setItem(
            browserVoteLocksStorageKey,
            JSON.stringify({
                lockedPolls: {
                    'poll-123': true,
                },
            }),
        );

        const store = createAppStore();

        expect(selectIsPollLocked(store.getState(), 'poll-123')).toBe(true);
    });

    test('ignores malformed persisted browser vote lock data', () => {
        window.localStorage.clear();
        window.localStorage.setItem(browserVoteLocksStorageKey, '{');

        const store = createAppStore();

        expect(selectIsPollLocked(store.getState(), 'poll-123')).toBe(false);
    });
});
