import createError from 'http-errors';
import { ERROR_MESSAGES, type VoteRequest } from '@okay-vote/contracts';

import { uuidRegex } from 'utils/validation';

export type AvailableChoice = {
    choiceName: string;
    id: string;
};

export type NormalizedVoteSubmission = {
    voterName: string;
    votes: Record<string, number>;
};

export const normalizeVoteSubmission = ({
    voterName,
    votes,
}: VoteRequest): NormalizedVoteSubmission => ({
    voterName: voterName.trim(),
    votes: Object.fromEntries(
        Object.entries(votes).map(([choiceName, score]) => [
            choiceName.trim(),
            score,
        ]),
    ),
});

export const validateVoteSubmission = ({
    pollId,
    voterName,
    votes,
}: {
    pollId: string;
    voterName: string;
    votes: Record<string, number>;
}): void => {
    if (!uuidRegex.test(pollId)) {
        throw createError(400, ERROR_MESSAGES.invalidPollId);
    }

    if (!voterName) {
        throw createError(400, ERROR_MESSAGES.voterNameRequired);
    }

    if (Object.keys(votes).length === 0) {
        throw createError(400, ERROR_MESSAGES.emptyVoteSubmission);
    }
};

export const getStoredVotes = (
    votes: Record<string, number>,
    availableChoices: AvailableChoice[],
): Array<{ choiceId: string; score: number }> =>
    Object.entries(votes).reduce<Array<{ choiceId: string; score: number }>>(
        (acc, [choiceName, score]) => {
            const choiceId = availableChoices.find(
                (choice) => choice.choiceName === choiceName,
            )?.id;

            if (!choiceId) {
                return acc;
            }

            return [...acc, { choiceId, score }];
        },
        [],
    );

export const assertHasStoredVotes = (
    votes: Array<{ choiceId: string; score: number }>,
): void => {
    if (votes.length === 0) {
        throw createError(400, ERROR_MESSAGES.noValidVotes);
    }
};
