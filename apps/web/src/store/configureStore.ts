import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { pollsApi } from 'store/pollsApi';

export const store = configureStore({
    reducer: {
        [pollsApi.reducerPath]: pollsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(pollsApi.middleware),
    devTools: import.meta.env.MODE !== 'production',
});

setupListeners(store.dispatch);
