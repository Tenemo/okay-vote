import { type ReactElement, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import copy from 'copy-to-clipboard';
import { Helmet } from 'react-helmet-async';
import {
    DEFAULT_VOTE_SCORE,
    MINIMUM_END_POLL_VOTERS,
} from '@okay-vote/contracts';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Panel } from '@/components/ui/panel';
import { Spinner } from '@/components/ui/spinner';

import LoadingButton from 'components/LoadingButton';
import NotFound from 'components/NotFound';
import VoteItem from 'components/VoteItem';
import VoteResults from 'components/VoteResults';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import { selectOrganizerToken } from 'store/organizerTokensSlice';
import {
    useEndPollMutation,
    useGetPollQuery,
    useVoteMutation,
} from 'store/pollsApi';
import { markPollAsVoted, selectIsPollLocked } from 'store/voteLocksSlice';
import { renderError } from 'utils/utils';
import { useVoteSubmission } from './useVoteSubmission';

type PollPageContentProps = {
    pollSlug: string;
};

const PollPageContent = ({ pollSlug }: PollPageContentProps): ReactElement => {
    const dispatch = useAppDispatch();
    const pollUrl = window.location.href;

    const {
        data: poll,
        error,
        isLoading,
    } = useGetPollQuery(pollSlug, {
        pollingInterval: 5000,
        refetchOnFocus: true,
        refetchOnReconnect: true,
        skipPollingIfUnfocused: true,
    });
    const [
        submitVote,
        { error: voteError, isLoading: isVoting, isSuccess: hasSubmittedVote },
    ] = useVoteMutation();
    const [endPoll, { error: endPollError, isLoading: isEndingPoll }] =
        useEndPollMutation();
    const pollRef = poll?.id || poll?.slug || pollSlug;
    const isPollEnded = Boolean(poll?.endedAt);
    const isVoteLocked = useAppSelector((state) =>
        selectIsPollLocked(state, pollRef),
    );
    const organizerToken = useAppSelector((state) =>
        selectOrganizerToken(state, [
            poll?.id ?? '',
            poll?.slug ?? '',
            pollSlug,
        ]),
    );
    const isBrowserVoteLocked = isVoteLocked || hasSubmittedVote;
    const isVoteSubmissionLocked = isPollEnded || isBrowserVoteLocked;
    const hasEnoughVotersToEndPoll =
        (poll?.voters.length ?? 0) >= MINIMUM_END_POLL_VOTERS;

    useEffect(() => {
        if (hasSubmittedVote) {
            dispatch(markPollAsVoted({ pollRef }));
        }
    }, [dispatch, hasSubmittedVote, pollRef]);

    const {
        isSubmitEnabled,
        onSubmit,
        onVote,
        selectedScores,
        setVoterName,
        voterName,
    } = useVoteSubmission({
        choiceNames: poll?.choices ?? [],
        hasSubmittedVote,
        isVoteLocked: isVoteSubmissionLocked,
        isVoting,
        pollRef,
        submitVote,
    });

    return (
        <>
            <Helmet>
                <title>{poll ? poll.pollName : 'Vote'}</title>
            </Helmet>
            {!poll && isLoading && (
                <div className="flex min-h-[40vh] items-center justify-center">
                    <Panel className="flex min-h-48 w-full max-w-xl items-center justify-center">
                        <Spinner className="size-10" />
                    </Panel>
                </div>
            )}
            {!poll && error && (
                <div className="mx-auto max-w-3xl">
                    <Panel className="space-y-4">
                        <Alert variant="destructive">
                            <AlertDescription>
                                {renderError(error)}
                            </AlertDescription>
                        </Alert>
                    </Panel>
                </div>
            )}
            {poll && (
                <div className="flex w-full flex-col gap-6">
                    <Panel className="flex flex-col gap-6">
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-secondary">
                                    Vote
                                </p>
                                <h1 className="page-title">{poll.pollName}</h1>
                                <p className="text-sm font-medium text-secondary">
                                    Created on {poll.createdAt.slice(0, 10)}
                                </p>
                                <p className="page-lead max-w-3xl">
                                    {isPollEnded
                                        ? 'This poll has ended. Final results are now visible to everyone and new votes are closed.'
                                        : `Rate every option on a scale from 1 to 10. Each choice starts at ${DEFAULT_VOTE_SCORE}, and the ranking is calculated from the geometric mean of submitted votes.`}
                                </p>
                            </div>
                            {isPollEnded && (
                                <Alert>
                                    <AlertDescription>
                                        This poll has ended. You can still
                                        review the final results and the
                                        participants list below.
                                    </AlertDescription>
                                </Alert>
                            )}
                            {!isPollEnded && hasSubmittedVote && (
                                <Alert variant="success">
                                    <AlertDescription>
                                        <p className="font-medium text-foreground">
                                            You have voted successfully.
                                        </p>
                                    </AlertDescription>
                                </Alert>
                            )}
                            {!isPollEnded &&
                                !hasSubmittedVote &&
                                isVoteLocked && (
                                    <Alert>
                                        <AlertDescription>
                                            <p className="font-medium text-foreground">
                                                You have already voted in this
                                                browser for this vote.
                                            </p>
                                            <p className="field-note">
                                                This page stays locked after a
                                                refresh in the current browser.
                                            </p>
                                        </AlertDescription>
                                    </Alert>
                                )}

                            <div className="grid gap-2">
                                <Label htmlFor="pollUrl">Share vote link</Label>
                                <div className="relative">
                                    <Input
                                        aria-describedby="copy-page-link-helper-text"
                                        className="pr-14"
                                        id="pollUrl"
                                        readOnly
                                        value={pollUrl}
                                        variant="filled"
                                    />
                                    <Button
                                        aria-label="Copy page link"
                                        className="absolute right-2 top-1/2 -translate-y-1/2"
                                        onClick={() => copy(pollUrl)}
                                        size="icon"
                                        title="Copy to clipboard"
                                        type="button"
                                        variant="ghost"
                                    >
                                        <Copy className="size-4" />
                                    </Button>
                                </div>
                                <p
                                    className="field-note"
                                    id="copy-page-link-helper-text"
                                >
                                    Link to the vote to share with others.
                                </p>
                            </div>
                        </div>

                        {!isPollEnded && organizerToken && (
                            <div className="grid gap-3 border-t border-border/70 pt-6">
                                {endPollError && (
                                    <Alert variant="destructive">
                                        <AlertDescription>
                                            {renderError(endPollError)}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <div className="grid w-full gap-2">
                                    {!hasEnoughVotersToEndPoll && (
                                        <p
                                            className="field-note w-full text-left"
                                            id="end-poll-helper-text"
                                        >
                                            At least {MINIMUM_END_POLL_VOTERS}{' '}
                                            people must vote before you can
                                            close the poll and show results.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <LoadingButton
                                            aria-describedby={
                                                hasEnoughVotersToEndPoll
                                                    ? undefined
                                                    : 'end-poll-helper-text'
                                            }
                                            className="w-full sm:min-w-72 sm:w-auto"
                                            disabled={!hasEnoughVotersToEndPoll}
                                            loading={isEndingPoll}
                                            loadingLabel="Closing poll"
                                            onClick={() => {
                                                if (!hasEnoughVotersToEndPoll) {
                                                    return;
                                                }

                                                void endPoll({
                                                    pollRef,
                                                    endPollData: {
                                                        organizerToken,
                                                    },
                                                });
                                            }}
                                            variant="default"
                                        >
                                            Close poll and show results
                                        </LoadingButton>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Panel>

                    {isPollEnded && poll.results && (
                        <VoteResults results={poll.results} />
                    )}

                    {!isPollEnded && !isBrowserVoteLocked && (
                        <Panel className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    Cast your vote
                                </h2>
                                <p className="field-note">
                                    {`Rate choices from 1 to 10. Each choice starts at ${DEFAULT_VOTE_SCORE}, and the final ranking is based on the geometric mean across all submitted votes.`}
                                </p>
                            </div>
                            <ul className="space-y-4">
                                {poll.choices.map((choiceName: string) => (
                                    <VoteItem
                                        choiceName={choiceName}
                                        key={choiceName}
                                        onVote={onVote}
                                        selectedScore={
                                            selectedScores[choiceName]
                                        }
                                    />
                                ))}
                            </ul>
                            <div className="space-y-4 border-t border-border/70 pt-6">
                                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                                    <div className="grid gap-2">
                                        <Label htmlFor="voterName">
                                            Voter name*
                                        </Label>
                                        <Input
                                            id="voterName"
                                            maxLength={32}
                                            name="voterName"
                                            onChange={({ target: { value } }) =>
                                                setVoterName(value)
                                            }
                                            required
                                            value={voterName}
                                        />
                                        <p className="field-note">
                                            Your name appears in the
                                            participants list for this vote.
                                        </p>
                                    </div>
                                    <LoadingButton
                                        className="w-full sm:mt-8 sm:w-auto sm:min-w-40"
                                        disabled={!isSubmitEnabled}
                                        loading={isVoting}
                                        loadingLabel="Submitting vote"
                                        onClick={onSubmit}
                                        size="lg"
                                    >
                                        Submit your choices
                                    </LoadingButton>
                                </div>
                                {voteError && (
                                    <Alert variant="destructive">
                                        <AlertDescription>
                                            {renderError(voteError)}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </Panel>
                    )}

                    <Panel padding="compact" tone="subtle">
                        <h2 className="text-lg font-semibold tracking-tight">
                            Participants
                        </h2>
                        <p className="mt-2 text-sm leading-7 text-secondary">
                            {poll.voters.length
                                ? `Voters in this vote: ${poll.voters.join(', ')}`
                                : 'No voters yet.'}
                        </p>
                    </Panel>
                </div>
            )}
        </>
    );
};

export const PollPage = (): ReactElement => {
    const { pollSlug } = useParams();

    if (!pollSlug) {
        return <NotFound />;
    }

    return <PollPageContent pollSlug={pollSlug} />;
};

export default PollPage;
