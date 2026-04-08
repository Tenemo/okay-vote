import { useEffect, useState } from 'react';

import type { VoteRequest } from '@okay-vote/contracts';

type SubmitVoteTrigger = (payload: {
    pollRef: string;
    voteData: VoteRequest;
}) => unknown;

type UseVoteSubmissionArgs = {
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
    hasSubmittedVote,
    isVoteLocked,
    isVoting,
    pollRef,
    submitVote,
}: UseVoteSubmissionArgs): UseVoteSubmissionResult => {
    const [selectedScores, setSelectedScores] = useState<
        Record<string, number>
    >({});
    const [voterName, setVoterNameState] = useState('');
    const trimmedVoterName = voterName.trim();

    useEffect(() => {
        if (hasSubmittedVote) {
            setSelectedScores({});
        }
    }, [hasSubmittedVote]);

    const onVote = (choiceName: string, score: number): void => {
        setSelectedScores((currentScores) => ({
            ...currentScores,
            [choiceName]: score,
        }));
    };

    const onSubmit = (): void => {
        if (isVoteLocked) {
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

    const isSubmitEnabled =
        pollRef.trim().length > 0 &&
        Object.keys(selectedScores).length > 0 &&
        trimmedVoterName.length > 0 &&
        !isVoting &&
        !isVoteLocked;

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
