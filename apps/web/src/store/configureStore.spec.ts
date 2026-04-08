import { describe, expect, test } from 'vitest';

import { createAppStore } from './configureStore';
import { pollsApi } from './pollsApi';
import {
    organizerTokensStorageKey,
    selectOrganizerToken,
    storeOrganizerToken,
} from './organizerTokensSlice';
import {
    legacyVoteLocksStorageKey,
    markPollAsVoted,
    selectIsPollLocked,
    voteLocksStorageKey,
} from './voteLocksSlice';

describe('createAppStore', () => {
    test('persists organizer tokens to local storage for trimmed poll refs', () => {
        window.localStorage.clear();

        const store = createAppStore();

        store.dispatch(
            storeOrganizerToken({
                organizerToken: ' token-123 ',
                pollRefs: [' poll-123 ', ' poll-slug '],
            }),
        );

        expect(
            JSON.parse(
                window.localStorage.getItem(organizerTokensStorageKey) ?? '{}',
            ),
        ).toEqual({
            organizerTokensByPollRef: {
                'poll-123': 'token-123',
                'poll-slug': 'token-123',
            },
        });
    });

    test('rehydrates persisted organizer tokens into Redux on a new store', () => {
        window.localStorage.clear();
        window.localStorage.setItem(
            organizerTokensStorageKey,
            JSON.stringify({
                organizerTokensByPollRef: {
                    ' poll-123 ': ' token-123 ',
                },
            }),
        );

        const store = createAppStore();

        expect(selectOrganizerToken(store.getState(), ['poll-123'])).toBe(
            'token-123',
        );
    });

    test('ignores malformed persisted organizer token data', () => {
        window.localStorage.clear();
        window.localStorage.setItem(organizerTokensStorageKey, '{');

        const store = createAppStore();

        expect(selectOrganizerToken(store.getState(), ['poll-123'])).toBeNull();
    });

    test('persists trimmed vote locks to local storage', () => {
        window.localStorage.clear();

        const store = createAppStore();

        store.dispatch(markPollAsVoted({ pollRef: ' poll-123 ' }));

        expect(
            JSON.parse(
                window.localStorage.getItem(voteLocksStorageKey) ?? '{}',
            ),
        ).toEqual({
            lockedPolls: {
                'poll-123': true,
            },
        });
    });

    test('rehydrates persisted vote locks into Redux on a new store', () => {
        window.localStorage.clear();
        window.localStorage.setItem(
            voteLocksStorageKey,
            JSON.stringify({
                lockedPolls: {
                    ' poll-123 ': true,
                },
            }),
        );

        const store = createAppStore();

        expect(selectIsPollLocked(store.getState(), 'poll-123')).toBe(true);
    });

    test('rehydrates persisted legacy vote locks into Redux on a new store', () => {
        window.localStorage.clear();
        window.localStorage.setItem(
            legacyVoteLocksStorageKey,
            JSON.stringify({
                lockedPolls: {
                    ' poll-123 ': true,
                },
            }),
        );

        const store = createAppStore();

        expect(selectIsPollLocked(store.getState(), 'poll-123')).toBe(true);
    });

    test('falls back to persisted legacy vote locks when the new key exists without locked polls', () => {
        window.localStorage.clear();
        window.localStorage.setItem(voteLocksStorageKey, JSON.stringify({}));
        window.localStorage.setItem(
            legacyVoteLocksStorageKey,
            JSON.stringify({
                lockedPolls: {
                    ' poll-123 ': true,
                },
            }),
        );

        const store = createAppStore();

        expect(selectIsPollLocked(store.getState(), 'poll-123')).toBe(true);
    });

    test('ignores malformed persisted vote lock data', () => {
        window.localStorage.clear();
        window.localStorage.setItem(voteLocksStorageKey, '{');

        const store = createAppStore();

        expect(selectIsPollLocked(store.getState(), 'poll-123')).toBe(false);
    });

    test('does not persist vote locks again for unrelated store updates', () => {
        window.localStorage.clear();
        const setItemSpy = vi.spyOn(window.localStorage.__proto__, 'setItem');
        const store = createAppStore();

        store.dispatch(pollsApi.util.resetApiState());

        expect(setItemSpy).not.toHaveBeenCalled();

        setItemSpy.mockRestore();
    });
});
