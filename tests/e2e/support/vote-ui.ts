import { expect, type Page } from '@playwright/test';

export const chooseScore = async (
    page: Page,
    choiceName: string,
    score: number,
): Promise<void> => {
    await page
        .getByRole('group', { name: choiceName })
        .getByText(`${score}`, { exact: true })
        .click();
};

export const createPoll = async (
    page: Page,
    {
        choices,
        pollName,
    }: {
        choices: string[];
        pollName: string;
    },
): Promise<void> => {
    await page.goto('/');
    await page.getByLabel('Vote name').fill(pollName);

    for (const choice of choices) {
        await page.getByLabel('Choice to vote for').fill(choice);
        await page.getByRole('button', { name: 'Add new choice' }).click();
    }

    await page.getByRole('button', { name: 'Create vote' }).click();
    await expect(page).toHaveURL(/\/votes\/.+/);
};

export const submitVote = async (
    page: Page,
    {
        scoresByChoice,
        voterName,
    }: {
        scoresByChoice: Record<string, number>;
        voterName: string;
    },
): Promise<void> => {
    for (const [choiceName, score] of Object.entries(scoresByChoice)) {
        await chooseScore(page, choiceName, score);
    }

    await page.getByLabel('Voter name*').fill(voterName);
    await page.getByRole('button', { name: 'Submit your choices' }).click();
};
