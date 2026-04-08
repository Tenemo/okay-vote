import { expect, test, type Browser, type Page } from '@playwright/test';

import { createBrowserErrorTracker } from './support/error-tracking';
import { createPoll, submitVote } from './support/vote-ui';

const viewports = [
    {
        label: '320px mobile',
        width: 320,
        height: 800,
    },
    {
        label: '390px mobile',
        width: 390,
        height: 844,
    },
    {
        label: 'tablet',
        width: 768,
        height: 1024,
    },
] as const;

const expectNoHorizontalOverflow = async (page: Page): Promise<void> => {
    const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
};

const expectTapTargetSize = async (
    page: Page,
    accessibleName: string,
): Promise<void> => {
    const button = page.getByRole('button', { name: accessibleName });

    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeVisible();

    const box = await button.boundingBox();

    expect(box).not.toBeNull();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(24);
};

const openSecondViewer = async (
    browser: Browser,
    viewport: { height: number; width: number },
    pollUrl: string,
) => {
    const secondContext = await browser.newContext({
        viewport,
    });
    const secondPage = await secondContext.newPage();

    await secondPage.goto(pollUrl);

    return { secondContext, secondPage };
};

for (const viewport of viewports) {
    test(`keeps the create, vote, share, and results flows usable on ${viewport.label}`, async ({
        browser,
        page,
    }) => {
        const errorTracker = createBrowserErrorTracker();
        errorTracker.attachToPage(page, viewport.label);

        await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
        });
        await page.goto('/');

        await expectNoHorizontalOverflow(page);
        await page.keyboard.press('Tab');
        await expect(
            page.getByRole('link', { name: 'Skip to main content' }),
        ).toBeFocused();

        await createPoll(page, {
            pollName: `Responsive poll ${viewport.width} ${Date.now()}`,
            choices: [
                'LOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOONG',
                'Bananas',
            ],
        });

        await expectNoHorizontalOverflow(page);
        await expectTapTargetSize(page, 'Share vote link');
        await expectTapTargetSize(page, 'Copy vote link');
        await expectTapTargetSize(page, 'Submit your choices');

        const pollUrl = page.url();
        const { secondContext, secondPage } = await openSecondViewer(
            browser,
            viewport,
            pollUrl,
        );
        errorTracker.attachToPage(secondPage, `${viewport.label}-viewer`);

        await submitVote(page, {
            scoresByChoice: {
                LOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOONG: 7,
                Bananas: 4,
            },
            voterName: 'Alice',
        });
        await submitVote(secondPage, {
            scoresByChoice: {
                LOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOONG: 9,
                Bananas: 6,
            },
            voterName: 'Bob',
        });

        await page.reload();
        await page
            .getByRole('button', { name: 'Close poll and show results' })
            .click();
        await expect(
            page.getByRole('heading', { name: 'Results' }),
        ).toBeVisible({ timeout: 30_000 });
        await expectNoHorizontalOverflow(page);
        await expect(page.getByText('Alice')).toBeVisible();
        await expect(page.getByText('Bob')).toBeVisible();

        errorTracker.assertClean();
        await secondContext.close();
    });
}
