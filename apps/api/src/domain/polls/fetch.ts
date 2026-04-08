import gmean from 'gmean';
import type { PollResponse } from '@okay-vote/contracts';

type PollChoiceRecord = {
    choiceName: string;
};

type PollVoteRecord = {
    choice: PollChoiceRecord;
    score: number;
    voterName: string;
};

export type PollRecord = {
    choices: PollChoiceRecord[];
    createdAt: string;
    id: string;
    pollName: string;
    slug: string;
    votes: PollVoteRecord[];
};

const getChoices = (choices: PollChoiceRecord[]): string[] =>
    choices.map(({ choiceName }) => choiceName);

const getVoters = (votes: PollVoteRecord[]): string[] =>
    Array.from(new Set(votes.map(({ voterName }) => voterName)));

const getResults = (votes: PollVoteRecord[]): Record<string, number> => {
    const scoresByChoice = new Map<string, number[]>();

    for (const {
        choice: { choiceName },
        score,
    } of votes) {
        const scores = scoresByChoice.get(choiceName);

        if (scores) {
            scores.push(score);
            continue;
        }

        scoresByChoice.set(choiceName, [score]);
    }

    const results: Record<string, number> = {};

    for (const [choiceName, scores] of scoresByChoice) {
        results[choiceName] = Number(gmean(scores).toFixed(2));
    }

    return results;
};

export const buildPollResponse = (poll: PollRecord): PollResponse => {
    const choices = getChoices(poll.choices);
    const voters = getVoters(poll.votes);

    if (voters.length < 2) {
        return {
            id: poll.id,
            slug: poll.slug,
            pollName: poll.pollName,
            createdAt: poll.createdAt,
            choices,
            voters,
        };
    }

    return {
        id: poll.id,
        slug: poll.slug,
        pollName: poll.pollName,
        createdAt: poll.createdAt,
        choices,
        results: getResults(poll.votes),
        voters,
    };
};
