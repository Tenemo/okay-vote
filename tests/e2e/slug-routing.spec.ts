import { expect, test, type Page } from '@playwright/test';

test('creates duplicate-titled polls with distinct slug links', async ({
    browser,
    page,
}) => {
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
    await firstPage.goto(firstPollUrl);
    await expect(firstPage.getByText('Alpha')).toBeVisible();
    await expect(firstPage.getByText('Gamma')).toHaveCount(0);

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    await secondPage.goto(secondPollUrl);
    await expect(secondPage.getByText('Gamma')).toBeVisible();
    await expect(secondPage.getByText('Alpha')).toHaveCount(0);

    await firstContext.close();
    await secondContext.close();
});

test('shows not found for old UUID browser URLs', async ({ page }) => {
    await page.goto('/votes/123e4567-e89b-42d3-a456-426614174000');

    await expect(
        page.getByRole('button', { name: 'Go back to vote creation' }),
    ).toBeVisible();
});

const screenLinkHref = async (page: Page): Promise<string> => {
    const link = page.locator('a[href*="/votes/"]');
    const href = await link.first().getAttribute('href');

    if (!href) {
        throw new Error('Expected created poll link href.');
    }

    return href;
};
