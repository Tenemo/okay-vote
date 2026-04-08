import { expect, test } from '@playwright/test';

import { createBrowserErrorTracker } from './support/error-tracking';
import { chooseScore, createPoll, submitVote } from './support/vote-ui';

test('ends a poll and reveals final results to other viewers', async ({
    browser,
    page,
}) => {
    const errorTracker = createBrowserErrorTracker();
    errorTracker.attachToPage(page, 'page-1');

    await createPoll(page, {
        pollName: `E2E vote ${Date.now()}`,
        choices: ['Apples', 'Bananas'],
    });

    await expect(page).toHaveURL(/\/votes\/[a-z0-9-]+--[a-z0-9]{8,32}$/);
    const pollUrl = page.url();

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    errorTracker.attachToPage(secondPage, 'page-2');
    await secondPage.goto(pollUrl);

    await expect(
        page.getByRole('button', { name: 'Close poll and show results' }),
    ).toBeDisabled();

    await submitVote(page, {
        scoresByChoice: {
            Apples: 7,
            Bananas: 4,
        },
        voterName: 'Alice',
    });

    await submitVote(secondPage, {
        scoresByChoice: {
            Apples: 9,
            Bananas: 6,
        },
        voterName: 'Bob',
    });

    await page.reload();

    await expect(
        page.getByRole('button', { name: 'Close poll and show results' }),
    ).toBeEnabled();
    await page
        .getByRole('button', { name: 'Close poll and show results' })
        .click();

    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({
        timeout: 30_000,
    });
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

test('selects scores correctly when a choice name is numeric', async ({
    page,
}) => {
    const errorTracker = createBrowserErrorTracker();
    errorTracker.attachToPage(page, 'numeric-choice');

    await createPoll(page, {
        pollName: `Numeric choice ${Date.now()}`,
        choices: ['7', 'Apples'],
    });

    await chooseScore(page, '7', 8);
    await expect(
        page
            .getByRole('group', { name: '7' })
            .locator('input[type="radio"][value="8"]'),
    ).toBeChecked();

    errorTracker.assertClean();
});
