import { expect, test } from '@playwright/test';

import { createBrowserErrorTracker } from './support/error-tracking';

test('shows an error when the same voter submits the same choice twice', async ({
    browser,
    page,
}) => {
    const errorTracker = createBrowserErrorTracker({
        ignoreConsoleMessage: (message) =>
            message.includes('status of 409 (Conflict)'),
        ignoreResponse: (response) =>
            response.status() === 409 &&
            response.url().includes('/api/polls/') &&
            response.url().endsWith('/vote'),
    });
    errorTracker.attachToPage(page, 'page-1');

    await page.goto('/');

    await page.getByLabel('Vote name').fill(`Duplicate vote ${Date.now()}`);
    await page.getByLabel('Choice to vote for').fill('Apples');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByLabel('Choice to vote for').fill('Bananas');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByRole('button', { name: 'Create vote' }).click();

    await expect(page).toHaveURL(
        /\/votes\/duplicate-vote-\d+--[a-z0-9]{8,32}$/,
    );
    const pollUrl = page.url();

    await page.getByRole('button', { name: '7' }).first().click();
    await page.getByLabel('Voter name*').fill('Alice');
    await page.getByRole('button', { name: 'Submit your choices' }).click();
    await expect(page.getByText('You have voted successfully.')).toBeVisible();

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    errorTracker.attachToPage(secondPage, 'page-2');
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
    errorTracker.assertClean();

    await secondContext.close();
});

test('keeps the browser vote lock after a refresh in the same browser', async ({
    page,
}) => {
    let voteRequestCount = 0;
    const errorTracker = createBrowserErrorTracker();
    errorTracker.attachToPage(page, 'page-1');

    page.on('request', (request) => {
        if (
            request.method() === 'POST' &&
            request.url().includes('/api/polls/') &&
            request.url().endsWith('/vote')
        ) {
            voteRequestCount += 1;
        }
    });

    await page.goto('/');

    await page.getByLabel('Vote name').fill(`Browser lock ${Date.now()}`);
    await page.getByLabel('Choice to vote for').fill('Apples');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByLabel('Choice to vote for').fill('Bananas');
    await page.getByRole('button', { name: 'Add new choice' }).click();
    await page.getByRole('button', { name: 'Create vote' }).click();

    await expect(page).toHaveURL(
        /\/votes\/browser-lock-\d+--[a-z0-9]{8,32}$/,
    );
    await page.getByRole('button', { name: '7' }).first().click();
    await page.getByLabel('Voter name*').fill('Alice');
    await page.getByRole('button', { name: 'Submit your choices' }).click();

    await expect(page.getByText('You have voted successfully.')).toBeVisible();
    await expect(
        page.getByText(
            'This browser is now marked as already voted for this vote.',
        ),
    ).toBeVisible();
    await expect(
        page.getByText('This browser has already submitted a vote for this poll.'),
    ).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Submit your choices' }),
    ).toHaveCount(0);
    await expect(page.getByLabel('Voter name*')).toHaveCount(0);

    await page.reload();

    await expect(
        page.getByText('You have already voted in this browser for this vote.'),
    ).toBeVisible();
    await expect(
        page.getByText('This browser has already submitted a vote for this poll.'),
    ).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Submit your choices' }),
    ).toHaveCount(0);
    await expect(page.getByLabel('Voter name*')).toHaveCount(0);
    expect(voteRequestCount).toBe(1);
    errorTracker.assertClean();
});
