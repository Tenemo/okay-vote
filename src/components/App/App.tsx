import React, { Component, ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import 'normalize.css';
import { Helmet } from 'react-helmet-async';

import NotFound from 'components/NotFound';
import Header from 'components/Header';
import PollCreationPage from 'components/PollCreationPage';
import PollPage from 'components/PollPage';

import styles from './app.scss';

type State = {
    hasError: boolean;
    error: Error | string | null;
    errorInformation?: { componentStack: string } | null;
};
export class App extends Component {
    static getDerivedStateFromError = (): { hasError: boolean } => ({
        hasError: true,
    });

    readonly state: State = { hasError: false, error: null };

    componentDidCatch(
        error: Error | null,
        errorInformation: { componentStack: string },
    ): void {
        // eslint-disable-next-line no-console
        console.error(errorInformation.componentStack, error);
        this.setState({ error, errorInformation });
    }

    render(): ReactElement {
        const { hasError, error, errorInformation } = this.state;
        return (
            <>
                <Helmet>
                    <title>okay.vote</title>
                </Helmet>
                {hasError ? (
                    <div>
                        The application has crashed due to a rendering error.{' '}
                        <div className={styles.errorInfo}>
                            {JSON.stringify(error, null, 4)}
                            {JSON.stringify(errorInformation, null, 4)}
                        </div>
                    </div>
                ) : (
                    <>
                        <Header />
                        <Routes>
                            <Route element={<PollCreationPage />} path="/" />
                            <Route
                                element={<PollPage />}
                                path="/votes/:pollId"
                            />
                            <Route element={<NotFound />} path="*" />
                        </Routes>
                    </>
                )}
            </>
        );
    }
}

export default App;
