import { expect, test } from '@playwright/test';

test('does not leave the main content container mouse-focusable', async ({
    page,
}) => {
    await page.goto('/');

    const main = page.getByRole('main');
    const voteNameInput = page.getByLabel('Vote name');

    expect(await main.getAttribute('tabindex')).toBeNull();

    await page.keyboard.press('Tab');
    await expect(
        page.getByRole('link', { name: 'Skip to main content' }),
    ).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(main).toBeFocused();
    await expect.poll(() => main.getAttribute('tabindex')).toBe('-1');

    await voteNameInput.click();
    await expect(voteNameInput).toBeFocused();
    expect(await main.getAttribute('tabindex')).toBeNull();

    await main.click({ position: { x: 4, y: 4 } });
    await expect
        .poll(() =>
            page.evaluate(() => ({
                id: document.activeElement?.id ?? null,
                tagName: document.activeElement?.tagName ?? null,
            })),
        )
        .not.toEqual({
            id: 'main-content',
            tagName: 'MAIN',
        });
});
