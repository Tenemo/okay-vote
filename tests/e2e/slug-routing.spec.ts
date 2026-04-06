import { expect, test, type Page } from '@playwright/test';

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

    const firstPollUrl = await screenLinkHref(page);
    expect(firstPollUrl).toMatch(/\/votes\/shared-title-\d+--[a-z0-9]{8,32}$/);
    await page.getByRole('button', { name: 'Back to vote creation' }).click();

    await page.getByLabel('Vote name').fill(pollTitle);
    await page.getByLabel('Choice to vote for').fill('Gamma');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByLabel('Choice to vote for').fill('Delta');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByRole('button', { name: 'Create vote' }).click();

    const secondPollUrl = await screenLinkHref(page);
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

test('shows not found for old UUID browser URLs', async ({ page }) => {
    const errorTracker = createBrowserErrorTracker({
        ignoreResponse: (response) =>
            response.status() === 404 &&
            response.url().includes(
                '/api/polls/123e4567-e89b-42d3-a456-426614174000',
            ),
    });
    errorTracker.attachToPage(page, 'page-1');

    await page.goto('/votes/123e4567-e89b-42d3-a456-426614174000');

    await expect(
        page.getByRole('button', { name: 'Go back to vote creation' }),
    ).toBeVisible();
    errorTracker.assertClean();
});

const screenLinkHref = async (page: Page): Promise<string> => {
    const link = page.locator('a[href*="/votes/"]');
    const href = await link.first().getAttribute('href');

    if (!href) {
        throw new Error('Expected created poll link href.');
    }

    return href;
};
