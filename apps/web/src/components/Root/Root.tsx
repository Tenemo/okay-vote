import { type ReactElement } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import { darkTheme } from 'styles/theme';
import { store } from 'store/configureStore';

import App from 'components/App';
import 'styles/global.scss';

export const Root = (): ReactElement => {
    return (
        <Provider store={store}>
            <HelmetProvider>
                <ThemeProvider theme={darkTheme}>
                    <CssBaseline enableColorScheme />
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </ThemeProvider>
            </HelmetProvider>
        </Provider>
    );
};

export default Root;
