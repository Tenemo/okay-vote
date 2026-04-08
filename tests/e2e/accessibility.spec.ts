import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { createBrowserErrorTracker } from './support/error-tracking';
import { createPoll, submitVote } from './support/vote-ui';

const expectNoAxeViolations = async (page: Page): Promise<void> => {
    const results = await new AxeBuilder({ page }).analyze();
    const violationSummary = results.violations
        .map(
            ({ description, id, impact, nodes }) =>
                `${id} (${impact ?? 'unknown'}): ${description} [${nodes.length}]`,
        )
        .join('\n');

    expect(results.violations, violationSummary).toEqual([]);
};

test('create page has no axe violations', async ({ page }) => {
    const errorTracker = createBrowserErrorTracker();
    errorTracker.attachToPage(page, 'create-page');

    await page.goto('/');
    await expect(
        page.getByRole('heading', { name: 'Create a new vote' }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
    errorTracker.assertClean();
});

test('open poll page has no axe violations', async ({ page }) => {
    const errorTracker = createBrowserErrorTracker();
    errorTracker.attachToPage(page, 'open-poll');

    await createPoll(page, {
        pollName: `Accessible open poll ${Date.now()}`,
        choices: ['Apples', 'Bananas'],
    });

    await expect(
        page.getByRole('heading', { name: 'Cast your vote' }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
    errorTracker.assertClean();
});

test('ended poll page has no axe violations', async ({ browser, page }) => {
    const errorTracker = createBrowserErrorTracker();
    errorTracker.attachToPage(page, 'ended-poll-organizer');

    await createPoll(page, {
        pollName: `Accessible ended poll ${Date.now()}`,
        choices: ['Apples', 'Bananas'],
    });
    const pollUrl = page.url();

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    errorTracker.attachToPage(secondPage, 'ended-poll-voter');
    await secondPage.goto(pollUrl);

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
    await page
        .getByRole('button', { name: 'Close poll and show results' })
        .click();
    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible({
        timeout: 30_000,
    });

    await expectNoAxeViolations(page);
    errorTracker.assertClean();
    await secondContext.close();
});

test('poll error state has no axe violations', async ({ page }) => {
    const errorTracker = createBrowserErrorTracker({
        ignoreConsoleMessage: (message) =>
            message.includes(
                'Failed to load resource: the server responded with a status of 404',
            ),
        ignoreResponse: (response) =>
            response.status() === 404 &&
            response.url().includes('/api/polls/missing-poll--aaaabbbb'),
    });
    errorTracker.attachToPage(page, 'poll-error');

    await page.route('**/api/polls/missing-poll--aaaabbbb', async (route) => {
        await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({
                message: 'Poll not found.',
            }),
        });
    });

    await page.goto('/votes/missing-poll--aaaabbbb');
    await expect(page.getByText('Poll not found.')).toBeVisible();

    await expectNoAxeViolations(page);
    errorTracker.assertClean();
});
