import { expect, test } from '@playwright/test';

test('shows an error when the same voter submits the same choice twice', async ({
    browser,
    page,
}) => {
    await page.goto('/');

    await page.getByLabel('Vote name').fill(`Duplicate vote ${Date.now()}`);
    await page.getByLabel('Choice to vote for').fill('Apples');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByLabel('Choice to vote for').fill('Bananas');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByRole('button', { name: 'Create vote' }).click();
    await page.getByRole('button', { name: 'Go to vote' }).click();

    await expect(page).toHaveURL(/\/votes\/.+/);
    const pollUrl = page.url();

    await page.getByRole('button', { name: '7' }).first().click();
    await page.getByLabel('Voter name*').fill('Alice');
    await page
        .getByRole('button', { name: 'Submit your choices' })
        .click();
    await expect(page.getByText('You have voted successfully.')).toBeVisible();

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    await secondPage.goto(pollUrl);

    await secondPage.getByRole('button', { name: '8' }).first().click();
    await secondPage.getByLabel('Voter name*').fill('Alice');
    await secondPage
        .getByRole('button', { name: 'Submit your choices' })
        .click();

    await expect(
        secondPage.getByText(
            'Vote has already been submitted for one or more selected choices.',
        ),
    ).toBeVisible();

    await secondContext.close();
});
