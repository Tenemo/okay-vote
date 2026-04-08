import { expect, test } from '@playwright/test';

import { createBrowserErrorTracker } from './support/error-tracking';
import { createPoll, submitVote } from './support/vote-ui';

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

    await createPoll(page, {
        pollName: `Duplicate vote ${Date.now()}`,
        choices: ['Apples', 'Bananas'],
    });

    await expect(page).toHaveURL(
        /\/votes\/duplicate-vote-\d+--[a-z0-9]{8,32}$/,
    );
    const pollUrl = page.url();

    await submitVote(page, {
        scoresByChoice: {
            Apples: 7,
        },
        voterName: 'Alice',
    });
    await expect(page.getByText('You have voted successfully.')).toBeVisible();

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    errorTracker.attachToPage(secondPage, 'page-2');
    await secondPage.goto(pollUrl);

    await submitVote(secondPage, {
        scoresByChoice: {
            Apples: 8,
        },
        voterName: 'Alice',
    });

    await expect(
        secondPage.getByText(
            'Vote has already been submitted for one or more selected choices.',
        ),
    ).toBeVisible();
    errorTracker.assertClean();

    await secondContext.close();
});

test('keeps the vote lock after a refresh in the same app session', async ({
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

    await createPoll(page, {
        pollName: `App lock ${Date.now()}`,
        choices: ['Apples', 'Bananas'],
    });

    await expect(page).toHaveURL(/\/votes\/app-lock-\d+--[a-z0-9]{8,32}$/);
    await submitVote(page, {
        scoresByChoice: {
            Apples: 7,
        },
        voterName: 'Alice',
    });

    await expect(page.getByText('You have voted successfully.')).toBeVisible();
    await expect(
        page.getByRole('heading', { name: 'Cast your vote' }),
    ).toHaveCount(0);
    await expect(
        page.getByRole('button', { name: 'Submit your choices' }),
    ).toHaveCount(0);
    await expect(page.getByLabel('Voter name*')).toHaveCount(0);

    await page.reload();

    await expect(page.getByText('You have voted successfully.')).toBeVisible();
    await expect(
        page.getByRole('heading', { name: 'Cast your vote' }),
    ).toHaveCount(0);
    await expect(
        page.getByRole('button', { name: 'Submit your choices' }),
    ).toHaveCount(0);
    await expect(page.getByLabel('Voter name*')).toHaveCount(0);
    expect(voteRequestCount).toBe(1);
    errorTracker.assertClean();
});
