import { expect, test } from '@playwright/test';

test('completes the two-voter happy path in the browser', async ({
    browser,
    page,
}) => {
    await page.goto('/');

    await page.getByLabel('Vote name').fill(`E2E vote ${Date.now()}`);
    await page.getByLabel('Choice to vote for').fill('Apples');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByLabel('Choice to vote for').fill('Bananas');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByRole('button', { name: 'Create vote' }).click();

    await expect(page.getByText('Vote successfully created!')).toBeVisible();
    await page.getByRole('button', { name: 'Go to vote' }).click();

    await expect(page).toHaveURL(/\/votes\/e2-e-vote-\d+--[a-z0-9]{8,32}$/);
    const pollUrl = page.url();

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    await secondPage.goto(pollUrl);

    await page.getByRole('button', { name: '7' }).first().click();
    await page.getByRole('button', { name: '4' }).nth(1).click();
    await page.getByLabel('Voter name*').fill('Alice');
    await page.getByRole('button', { name: 'Submit your choices' }).click();

    await secondPage.getByRole('button', { name: '9' }).first().click();
    await secondPage.getByRole('button', { name: '5' }).nth(1).click();
    await secondPage.getByLabel('Voter name*').fill('Bob');
    await secondPage
        .getByRole('button', { name: 'Submit your choices' })
        .click();

    await expect(
        page.getByRole('button', { name: 'Show current results' }),
    ).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Show current results' }).click();

    await expect(page.getByText('Results')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Alice, Bob')).toBeVisible();

    await secondContext.close();
});
