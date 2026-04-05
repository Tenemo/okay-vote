import { ThunkDispatch, ThunkAction } from 'redux-thunk';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { AnyAction } from 'redux';

import { PollsState, PollsActionTypes } from 'store/polls/pollsTypes';

export type RootState = {
    readonly polls: PollsState;
};

export type AllActions = PollsActionTypes;
export type CommonDispatch = ThunkDispatch<RootState, undefined, AllActions>;
export type AppDispatch = CommonDispatch;
export type ReduxState = RootState;
export type TypedDispatch = ThunkDispatch<ReduxState, undefined, AnyAction>;
export type TypedThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    ReduxState,
    undefined,
    AnyAction
>;
export const useTypedDispatch = (): TypedDispatch =>
    useDispatch<TypedDispatch>();
export const useTypedSelector: TypedUseSelectorHook<ReduxState> = useSelector;
