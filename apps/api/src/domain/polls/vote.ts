import createError from 'http-errors';
import {
    ERROR_MESSAGES,
    POLL_SLUG_REGEX,
    UUID_REGEX,
    type VoteRequest,
} from '@okay-vote/contracts';

type AvailableChoice = {
    choiceName: string;
    id: string;
};

type NormalizedVoteSubmission = {
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
    pollRef,
    voterName,
    votes,
}: {
    pollRef: string;
    voterName: string;
    votes: Record<string, number>;
}): void => {
    if (!UUID_REGEX.test(pollRef) && !POLL_SLUG_REGEX.test(pollRef)) {
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
): Array<{ choiceId: string; score: number }> => {
    const choiceIdByName = new Map(
        availableChoices.map(({ choiceName, id }) => [choiceName, id]),
    );
    const storedVotes: Array<{ choiceId: string; score: number }> = [];

    for (const [choiceName, score] of Object.entries(votes)) {
        const choiceId = choiceIdByName.get(choiceName);

        if (!choiceId) {
            continue;
        }

        storedVotes.push({ choiceId, score });
    }

    return storedVotes;
};

export const assertHasStoredVotes = (
    votes: Array<{ choiceId: string; score: number }>,
): void => {
    if (votes.length === 0) {
        throw createError(400, ERROR_MESSAGES.noValidVotes);
    }
};
