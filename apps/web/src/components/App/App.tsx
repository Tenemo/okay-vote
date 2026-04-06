import { Component, type ReactElement } from 'react';
import { Box, Typography } from '@mui/material';
import { Route, Routes } from 'react-router-dom';
import 'normalize.css';
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
                    <Box component="main" sx={{ m: 2 }}>
                        <Typography variant="h5">
                            The application has crashed due to a rendering
                            error.
                        </Typography>
                        <Box
                            component="pre"
                            sx={{
                                color: 'text.secondary',
                                mt: 2,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                            }}
                        >
                            {JSON.stringify(error, null, 4)}
                            {JSON.stringify(errorInformation, null, 4)}
                        </Box>
                    </Box>
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
