import { expect, type Page, type Response } from '@playwright/test';

type BrowserErrorTracker = {
    assertClean: () => void;
    attachToPage: (page: Page, label: string) => void;
};

export const createBrowserErrorTracker = ({
    ignoreConsoleMessage,
    ignoreResponse,
}: {
    ignoreConsoleMessage?: (message: string) => boolean;
    ignoreResponse?: (response: Response) => boolean;
} = {}): BrowserErrorTracker => {
    const unexpectedErrors: string[] = [];

    const attachToPage = (page: Page, label: string): void => {
        page.on('console', (message) => {
            if (
                message.type() === 'error' &&
                !(ignoreConsoleMessage?.(message.text()) ?? false)
            ) {
                unexpectedErrors.push(`[${label}] console: ${message.text()}`);
            }
        });
        page.on('pageerror', (error) => {
            unexpectedErrors.push(`[${label}] pageerror: ${error.message}`);
        });
        page.on('response', (response) => {
            if (
                response.url().includes('/api/') &&
                response.status() >= 400 &&
                !(ignoreResponse?.(response) ?? false)
            ) {
                unexpectedErrors.push(
                    `[${label}] response: ${response.status()} ${response.url()}`,
                );
            }
        });
    };

    return {
        attachToPage,
        assertClean: (): void => {
            expect(unexpectedErrors).toEqual([]);
        },
    };
};
