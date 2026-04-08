import { Component, lazy, Suspense, type ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';

import { Panel } from '@/components/ui/panel';
import { Spinner } from '@/components/ui/spinner';

import Header from 'components/Header';
import Seo from 'components/Seo';

const NotFound = lazy(() => import('components/NotFound'));
const PollCreationPage = lazy(() => import('components/PollCreationPage'));
const PollPage = lazy(() => import('components/PollPage'));

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

    renderRouteFallback = (): ReactElement => (
        <div className="flex min-h-[40vh] items-center justify-center">
            <Panel className="flex min-h-48 w-full max-w-xl items-center justify-center">
                <Spinner className="size-10" />
            </Panel>
        </div>
    );

    render(): ReactElement {
        const { hasError, error, errorInformation } = this.state;
        return (
            <>
                <Seo />
                <div className="flex min-h-full flex-col">
                    <Header />
                    <main className="flex flex-1 justify-center px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8">
                        <div className="w-full max-w-4xl">
                            {hasError ? (
                                <div className="flex min-h-[50vh] items-center justify-center">
                                    <Panel className="w-full max-w-2xl space-y-4">
                                        <div className="space-y-2">
                                            <h1 className="page-title">
                                                The application has crashed due
                                                to a rendering error.
                                            </h1>
                                            <p className="page-lead">
                                                Inspect the details below to
                                                understand what failed during
                                                rendering.
                                            </p>
                                        </div>
                                        <pre className="overflow-auto rounded-xl border border-border/70 bg-background/30 p-4 text-sm leading-6 whitespace-pre-wrap break-words text-secondary">
                                            {JSON.stringify(error, null, 4)}
                                            {JSON.stringify(
                                                errorInformation,
                                                null,
                                                4,
                                            )}
                                        </pre>
                                    </Panel>
                                </div>
                            ) : (
                                <Suspense fallback={this.renderRouteFallback()}>
                                    <Routes>
                                        <Route
                                            element={<PollCreationPage />}
                                            path="/"
                                        />
                                        <Route
                                            element={<PollPage />}
                                            path="/votes/:pollSlug"
                                        />
                                        <Route
                                            element={<NotFound />}
                                            path="*"
                                        />
                                    </Routes>
                                </Suspense>
                            )}
                        </div>
                    </main>
                </div>
            </>
        );
    }
}

export default App;
