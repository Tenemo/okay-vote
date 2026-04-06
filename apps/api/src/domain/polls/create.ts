import createError from 'http-errors';
import { ERROR_MESSAGES, type CreatePollRequest } from '@okay-vote/contracts';

export type NormalizedCreatePollInput = {
    choices: string[];
    pollName: string;
};

export const normalizeCreatePollInput = ({
    choices,
    pollName,
}: CreatePollRequest): NormalizedCreatePollInput => ({
    pollName: pollName.trim(),
    choices: choices.map((choice) => choice.trim()),
});

export const validateCreatePollInput = ({
    choices,
    pollName,
}: NormalizedCreatePollInput): void => {
    if (!pollName) {
        throw createError(400, ERROR_MESSAGES.pollNameRequired);
    }

    if (choices.length < 2) {
        throw createError(400, ERROR_MESSAGES.notEnoughChoices);
    }

    if (choices.some((choice) => !choice)) {
        throw createError(400, ERROR_MESSAGES.choiceNamesRequired);
    }

    if (new Set(choices).size !== choices.length) {
        throw createError(400, ERROR_MESSAGES.duplicateChoiceNames);
    }
};
