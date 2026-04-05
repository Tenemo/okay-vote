import {
    Store,
    createStore,
    applyMiddleware,
    compose,
    combineReducers,
    Middleware,
    type Reducer,
} from 'redux';
import { thunk } from 'redux-thunk';
import { createLogger } from 'redux-logger';
import {
    persistStore,
    persistReducer,
    type PersistConfig,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { PollsActionTypes } from 'store/polls/pollsTypes';
import { pollsReducer, initialPollsState } from 'store/polls/pollsReducer';
import { AppDispatch, RootState } from 'store/types';
import { BUILD_TYPE } from 'constants/appConstants';

declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
    }
}

const PERSIST_CONFIG: PersistConfig<RootState> = {
    key: 'root',
    storage,
};

export const initialState = { polls: initialPollsState };

const combinedReducer = combineReducers({
    polls: pollsReducer,
}) as unknown as Reducer<RootState, PollsActionTypes>;

export const rootReducer = persistReducer<RootState, PollsActionTypes>(
    PERSIST_CONFIG,
    combinedReducer,
);

const thunkMiddleware = thunk as Middleware<unknown, RootState, AppDispatch>;
const logger = createLogger({
    diff: true,
    collapsed: true,
}) as Middleware<unknown, RootState, AppDispatch>;

const composeEnhancers =
    typeof window !== 'undefined' &&
    typeof window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ === 'function'
        ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        : compose;

const configureStoreDev = (): Store<
    ReturnType<typeof rootReducer>,
    PollsActionTypes
> => {
    const middleware: Middleware<unknown, RootState, AppDispatch>[] = [
        thunkMiddleware,
        logger,
    ];

    return createStore(
        rootReducer,
        composeEnhancers(applyMiddleware(...middleware)),
    );
};

const configureStoreProd = (): Store<
    ReturnType<typeof rootReducer>,
    PollsActionTypes
> => {
    const middleware: Middleware<unknown, RootState, AppDispatch>[] = [
        thunkMiddleware,
    ];

    return createStore(rootReducer, compose(applyMiddleware(...middleware)));
};

const configureStore =
    BUILD_TYPE === `production` ? configureStoreProd : configureStoreDev;

export const store = configureStore();
export const persistor = persistStore(store);
