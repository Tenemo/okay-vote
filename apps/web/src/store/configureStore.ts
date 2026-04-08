import {
    combineReducers,
    configureStore,
    type EnhancedStore,
} from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { pollsApi } from 'store/pollsApi';
import voteLocksReducer, {
    loadVoteLocksState,
    persistVoteLocksState,
} from 'store/voteLocksSlice';

const rootReducer = combineReducers({
    [pollsApi.reducerPath]: pollsApi.reducer,
    voteLocks: voteLocksReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

const createPreloadedState = (): RootState => ({
    ...rootReducer(undefined, { type: '@@INIT' }),
    voteLocks: loadVoteLocksState(),
});

const buildAppStore = (): EnhancedStore<RootState> =>
    configureStore({
        reducer: rootReducer,
        preloadedState: createPreloadedState(),
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(pollsApi.middleware),
        devTools: import.meta.env.MODE !== 'production',
    });

export type AppStore = ReturnType<typeof buildAppStore>;
export type AppDispatch = AppStore['dispatch'];

export const createAppStore = (): AppStore => {
    const appStore = buildAppStore();
    let previousVoteLocks = appStore.getState().voteLocks;

    setupListeners(appStore.dispatch);
    appStore.subscribe(() => {
        const currentVoteLocks = appStore.getState().voteLocks;

        if (currentVoteLocks === previousVoteLocks) {
            return;
        }

        previousVoteLocks = currentVoteLocks;
        persistVoteLocksState(currentVoteLocks);
    });

    return appStore;
};

export const store = createAppStore();
