import { expect, test } from '@playwright/test';

import { createBrowserErrorTracker } from './support/error-tracking';

test('creates duplicate-titled polls with distinct slug links', async ({
    browser,
    page,
}) => {
    const errorTracker = createBrowserErrorTracker();
    errorTracker.attachToPage(page, 'page-1');
    const pollTitle = `Shared title ${Date.now()}`;

    await page.goto('/');

    await page.getByLabel('Vote name').fill(pollTitle);
    await page.getByLabel('Choice to vote for').fill('Alpha');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByLabel('Choice to vote for').fill('Beta');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByRole('button', { name: 'Create vote' }).click();

    await expect(page).toHaveURL(/\/votes\/shared-title-\d+--[a-z0-9]{8,32}$/);
    const firstPollUrl = page.url();
    expect(firstPollUrl).toMatch(/\/votes\/shared-title-\d+--[a-z0-9]{8,32}$/);
    await page.goto('/');

    await page.getByLabel('Vote name').fill(pollTitle);
    await page.getByLabel('Choice to vote for').fill('Gamma');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByLabel('Choice to vote for').fill('Delta');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByRole('button', { name: 'Create vote' }).click();

    await expect(page).toHaveURL(/\/votes\/shared-title-\d+--[a-z0-9]{8,32}$/);
    const secondPollUrl = page.url();
    expect(secondPollUrl).toMatch(/\/votes\/shared-title-\d+--[a-z0-9]{8,32}$/);
    expect(secondPollUrl).not.toBe(firstPollUrl);

    const firstContext = await browser.newContext();
    const firstPage = await firstContext.newPage();
    errorTracker.attachToPage(firstPage, 'page-2');
    await firstPage.goto(firstPollUrl);
    await expect(firstPage.getByText('Alpha')).toBeVisible();
    await expect(firstPage.getByText('Gamma')).toHaveCount(0);

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    errorTracker.attachToPage(secondPage, 'page-3');
    await secondPage.goto(secondPollUrl);
    await expect(secondPage.getByText('Gamma')).toBeVisible();
    await expect(secondPage.getByText('Alpha')).toHaveCount(0);

    await firstContext.close();
    await secondContext.close();
    errorTracker.assertClean();
});

test('keeps created vote links canonical when the create response omits slug', async ({
    page,
}) => {
    const errorTracker = createBrowserErrorTracker();
    errorTracker.attachToPage(page, 'page-1');

    await page.route('**/api/polls/create', async (route) => {
        const response = await route.fetch();
        const createdPoll =
            (await response.json()) as Record<string, unknown>;
        const { slug: _ignoredSlug, ...legacyCreateResponse } = createdPoll;

        await route.fulfill({
            response,
            json: legacyCreateResponse,
        });
    });

    await page.goto('/');
    await page.getByLabel('Vote name').fill(`Legacy URL ${Date.now()}`);
    await page.getByLabel('Choice to vote for').fill('Alpha');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByLabel('Choice to vote for').fill('Beta');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByRole('button', { name: 'Create vote' }).click();

    await expect(page).toHaveURL(/\/votes\/legacy-url-\d+--[a-z0-9]{8,32}$/);
    const pollUrl = page.url();
    expect(pollUrl).toMatch(/\/votes\/legacy-url-\d+--[a-z0-9]{8,32}$/);
    expect(pollUrl).not.toContain('/votes/undefined');
    await expect(page.getByText('Alpha')).toBeVisible();
    errorTracker.assertClean();
});

test('falls back to the poll ID route when legacy poll lookups omit slug too', async ({
    page,
}) => {
    const errorTracker = createBrowserErrorTracker();
    errorTracker.attachToPage(page, 'page-1');

    await page.route('**/api/polls/create', async (route) => {
        const response = await route.fetch();
        const createdPoll =
            (await response.json()) as Record<string, unknown>;
        const { slug: _ignoredSlug, ...legacyCreateResponse } = createdPoll;

        await route.fulfill({
            response,
            json: legacyCreateResponse,
        });
    });

    await page.route('**/api/polls/*', async (route) => {
        const requestUrl = new URL(route.request().url());
        const pollRef = requestUrl.pathname.split('/').pop() ?? '';

        if (!/^[0-9a-f-]{36}$/i.test(pollRef)) {
            await route.fallback();
            return;
        }

        const response = await route.fetch();
        const poll = (await response.json()) as Record<string, unknown>;
        const { slug: _ignoredSlug, ...legacyPollResponse } = poll;

        await route.fulfill({
            response,
            json: legacyPollResponse,
        });
    });

    await page.goto('/');
    await page.getByLabel('Vote name').fill(`Legacy ID URL ${Date.now()}`);
    await page.getByLabel('Choice to vote for').fill('Alpha');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByLabel('Choice to vote for').fill('Beta');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByRole('button', { name: 'Create vote' }).click();

    await expect(page).toHaveURL(
        /\/votes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    const pollUrl = page.url();
    expect(pollUrl).toMatch(
        /\/votes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(pollUrl).not.toContain('/votes/undefined');
    await expect(page.getByText('Alpha')).toBeVisible();
    errorTracker.assertClean();
});
