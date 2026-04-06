import { defineConfig, devices } from '@playwright/test';

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? '4000';
const webPort = process.env.PLAYWRIGHT_WEB_PORT ?? '3000';
const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
const webBaseUrl = `http://127.0.0.1:${webPort}`;
const apiServerCommand = process.env.CI
    ? 'pnpm --filter @okay-vote/api dev'
    : 'pnpm run docker:up && pnpm --filter @okay-vote/api dev';
const apiServerEnv = {
    ...process.env,
    PORT: apiPort,
};
const webServerEnv = {
    ...process.env,
    VITE_API_BASE_URL: apiBaseUrl,
};

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
            command: apiServerCommand,
            env: apiServerEnv,
            url: `${apiBaseUrl}/api/health-check`,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
        },
        {
            command: `pnpm --filter @okay-vote/web dev -- --host 127.0.0.1 --port ${webPort}`,
            env: webServerEnv,
            url: webBaseUrl,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
        },
    ],
});
