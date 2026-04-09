import { type ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { createAppStore } from 'store/configureStore';

export const getMetaContent = (selector: string): string | null =>
    document.head.querySelector(selector)?.getAttribute('content') ?? null;

export const renderPollCreationPageWithRoutes = (page: ReactElement): void => {
    const store = createAppStore();

    render(
        <Provider store={store}>
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route element={page} path="/" />
                    <Route
                        element={<div>Vote page</div>}
                        path="/votes/:pollRef"
                    />
                </Routes>
            </MemoryRouter>
        </Provider>,
    );
};

export const fillValidPollCreationForm = (): void => {
    fireEvent.change(screen.getByLabelText(/Vote name/i), {
        target: { value: ' Team lunch ' },
    });
    fireEvent.change(screen.getByLabelText('Choice to vote for'), {
        target: { value: ' Pizza ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add new choice' }));
    fireEvent.change(screen.getByLabelText('Choice to vote for'), {
        target: { value: ' Ramen ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add new choice' }));
};
