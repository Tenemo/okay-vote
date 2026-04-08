import { expect, test } from '@playwright/test';

import { createBrowserErrorTracker } from './support/error-tracking';

test('ends a poll and reveals final results to other viewers', async ({
    browser,
    page,
}) => {
    const errorTracker = createBrowserErrorTracker();
    errorTracker.attachToPage(page, 'page-1');

    await page.goto('/');

    await page.getByLabel('Vote name').fill(`E2E vote ${Date.now()}`);
    await page.getByLabel('Choice to vote for').fill('Apples');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByLabel('Choice to vote for').fill('Bananas');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByRole('button', { name: 'Create vote' }).click();

    await expect(page).toHaveURL(/\/votes\/[a-z0-9-]+--[a-z0-9]{8,32}$/);
    const pollUrl = page.url();

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    errorTracker.attachToPage(secondPage, 'page-2');
    await secondPage.goto(pollUrl);

    await expect(
        page.getByRole('button', { name: 'End poll and show results' }),
    ).toBeDisabled();

    await page.getByRole('button', { name: '7' }).first().click();
    await page.getByRole('button', { name: '4' }).nth(1).click();
    await page.getByLabel('Voter name*').fill('Alice');
    await page.getByRole('button', { name: 'Submit your choices' }).click();

    await secondPage.getByRole('button', { name: '9' }).first().click();
    await secondPage.getByRole('button', { name: '6' }).nth(1).click();
    await secondPage.getByLabel('Voter name*').fill('Bob');
    await secondPage
        .getByRole('button', { name: 'Submit your choices' })
        .click();

    await page.reload();

    await expect(
        page.getByRole('button', { name: 'End poll and show results' }),
    ).toBeEnabled();
    await page.getByRole('button', { name: 'End poll and show results' }).click();

    await expect(
        page.getByRole('heading', { name: 'Results' }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();
    await expect(
        secondPage.getByRole('heading', { name: 'Results' }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(secondPage.getByText('Alice')).toBeVisible();
    await expect(secondPage.getByText('Bob')).toBeVisible();
    await expect(
        secondPage.getByRole('heading', { name: 'Cast your vote' }),
    ).toHaveCount(0);
    await expect(
        secondPage.getByRole('button', { name: 'Submit your choices' }),
    ).toHaveCount(0);
    await expect(secondPage.getByLabel('Voter name*')).toHaveCount(0);
    errorTracker.assertClean();

    await secondContext.close();
});
