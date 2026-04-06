import { type ReactElement } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import { TooltipProvider } from '@/components/ui/tooltip';

import { store } from 'store/configureStore';

import App from 'components/App';
import ThemeProvider from 'components/ThemeProvider';

export const Root = (): ReactElement => {
    return (
        <Provider store={store}>
            <HelmetProvider>
                <ThemeProvider defaultTheme="dark" storageKey="okay-vote-theme">
                    <TooltipProvider>
                        <BrowserRouter>
                            <App />
                        </BrowserRouter>
                    </TooltipProvider>
                </ThemeProvider>
            </HelmetProvider>
        </Provider>
    );
};

export default Root;
