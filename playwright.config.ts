import { defineConfig, devices } from '@playwright/test';

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? '4100';
const webPort = process.env.PLAYWRIGHT_WEB_PORT ?? '3100';
const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
const webBaseUrl = `http://127.0.0.1:${webPort}`;
const shouldReuseExistingServer =
    process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === 'true';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 120_000,
    expect: {
        timeout: 15_000,
    },
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: webBaseUrl,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
            },
        },
    ],
    webServer: [
        {
            command: process.env.CI
                ? 'pnpm --filter @okay-vote/api dev'
                : 'pnpm run docker:up && pnpm --filter @okay-vote/api dev',
            env: {
                ...process.env,
                PORT: apiPort,
            },
            url: `${apiBaseUrl}/api/health-check`,
            reuseExistingServer: shouldReuseExistingServer,
            timeout: 120_000,
        },
        {
            command: 'pnpm --filter @okay-vote/web dev',
            env: {
                ...process.env,
                VITE_API_BASE_URL: apiBaseUrl,
                WEB_HOST: '127.0.0.1',
                WEB_PORT: webPort,
            },
            url: webBaseUrl,
            reuseExistingServer: shouldReuseExistingServer,
            timeout: 120_000,
        },
    ],
});
