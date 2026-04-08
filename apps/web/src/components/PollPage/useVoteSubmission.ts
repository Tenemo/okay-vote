import { useEffect, useState } from 'react';

import { DEFAULT_VOTE_SCORE, type VoteRequest } from '@okay-vote/contracts';

type SubmitVoteTrigger = (payload: {
    pollRef: string;
    voteData: VoteRequest;
}) => unknown;

type UseVoteSubmissionArgs = {
    choiceNames: string[];
    hasSubmittedVote: boolean;
    isVoteLocked: boolean;
    isVoting: boolean;
    pollRef: string;
    submitVote: SubmitVoteTrigger;
};

type UseVoteSubmissionResult = {
    isSubmitEnabled: boolean;
    onSubmit: () => void;
    onVote: (choiceName: string, score: number) => void;
    selectedScores: Record<string, number>;
    setVoterName: (value: string) => void;
    voterName: string;
};

export const useVoteSubmission = ({
    choiceNames,
    hasSubmittedVote,
    isVoteLocked,
    isVoting,
    pollRef,
    submitVote,
}: UseVoteSubmissionArgs): UseVoteSubmissionResult => {
    const buildDefaultScores = (): Record<string, number> =>
        Object.fromEntries(
            choiceNames.map((choiceName) => [choiceName, DEFAULT_VOTE_SCORE]),
        );
    const [selectedScores, setSelectedScores] =
        useState<Record<string, number>>(buildDefaultScores);
    const [voterName, setVoterNameState] = useState('');
    const trimmedVoterName = voterName.trim();

    useEffect(() => {
        if (hasSubmittedVote) {
            setSelectedScores({});
        }
    }, [hasSubmittedVote]);

    useEffect(() => {
        setSelectedScores((currentScores) => {
            const nextScores = Object.fromEntries(
                choiceNames.map((choiceName) => [
                    choiceName,
                    currentScores[choiceName] ?? DEFAULT_VOTE_SCORE,
                ]),
            );

            const hasSameScores = Object.entries(nextScores).every(
                ([choiceName, score]) => currentScores[choiceName] === score,
            );

            return Object.keys(currentScores).length ===
                Object.keys(nextScores).length && hasSameScores
                ? currentScores
                : nextScores;
        });
    }, [choiceNames]);

    const onVote = (choiceName: string, score: number): void => {
        setSelectedScores((currentScores) => ({
            ...currentScores,
            [choiceName]: score,
        }));
    };

    const isSubmitEnabled =
        pollRef.trim().length > 0 &&
        Object.keys(selectedScores).length > 0 &&
        trimmedVoterName.length > 0 &&
        !isVoting &&
        !isVoteLocked;

    const onSubmit = (): void => {
        if (!isSubmitEnabled || isVoteLocked) {
            return;
        }

        void submitVote({
            pollRef,
            voteData: {
                votes: selectedScores,
                voterName: trimmedVoterName,
            },
        });
    };

    const setVoterName = (value: string): void => {
        setVoterNameState(value);
    };

    return {
        isSubmitEnabled,
        onSubmit,
        onVote,
        selectedScores,
        setVoterName,
        voterName,
    };
};
