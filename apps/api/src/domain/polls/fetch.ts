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
    Array.from(new Set(choices.map(({ choiceName }) => choiceName)));

const getVoters = (votes: PollVoteRecord[]): string[] =>
    Array.from(new Set(votes.map(({ voterName }) => voterName)));

const getResults = (votes: PollVoteRecord[]): Record<string, number> =>
    Object.entries(
        votes.reduce<Record<string, number[]>>((acc, { choice, score }) => {
            const choiceName = choice.choiceName;

            if (!acc[choiceName]) {
                return {
                    ...acc,
                    [choiceName]: [score],
                };
            }

            return {
                ...acc,
                [choiceName]: [...acc[choiceName], score],
            };
        }, {}),
    ).reduce<Record<string, number>>(
        (acc, [choiceName, scores]) => ({
            ...acc,
            [choiceName]: Number(gmean(scores).toFixed(2)),
        }),
        {},
    );

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
