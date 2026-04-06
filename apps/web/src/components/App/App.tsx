import { Component, type ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import NotFound from 'components/NotFound';
import Header from 'components/Header';
import PollCreationPage from 'components/PollCreationPage';
import PollPage from 'components/PollPage';

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
                    <main className="m-4">
                        <h1 className="text-xl font-semibold tracking-tight">
                            The application has crashed due to a rendering
                            error.
                        </h1>
                        <pre className="mt-2 whitespace-pre-wrap break-words text-muted-foreground">
                            {JSON.stringify(error, null, 4)}
                            {JSON.stringify(errorInformation, null, 4)}
                        </pre>
                    </main>
                ) : (
                    <>
                        <Header />
                        <Routes>
                            <Route element={<PollCreationPage />} path="/" />
                            <Route
                                element={<PollPage />}
                                path="/votes/:pollSlug"
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
