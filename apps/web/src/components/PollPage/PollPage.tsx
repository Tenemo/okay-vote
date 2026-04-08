import {
    type FormEvent,
    type ReactElement,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';
import { useParams } from 'react-router-dom';
import copy from 'copy-to-clipboard';
import {
    DEFAULT_VOTE_SCORE,
    MINIMUM_END_POLL_VOTERS,
} from '@okay-vote/contracts';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Panel } from '@/components/ui/panel';
import { Spinner } from '@/components/ui/spinner';

import NotFound from 'components/NotFound';
import Seo from 'components/Seo';
import VoteResults from 'components/VoteResults';
import {
    buildPollOgImageAlt,
    buildPollOgImagePath,
    buildPollSeoDescription,
} from '../../seo/seoMetadata';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import { selectOrganizerToken } from 'store/organizerTokensSlice';
import {
    useEndPollMutation,
    useGetPollQuery,
    useVoteMutation,
} from 'store/pollsApi';
import { markPollAsVoted, selectIsPollLocked } from 'store/voteLocksSlice';
import { renderError } from 'utils/utils';
import OrganizerActions from './OrganizerActions';
import ParticipantsPanel from './ParticipantsPanel';
import SharePollLink, { type ShareLinkFeedback } from './SharePollLink';
import VoteForm from './VoteForm';
import { useVoteSubmission } from './useVoteSubmission';

type PollPageContentProps = {
    pollRef: string;
};

const defaultShareLinkFeedback: ShareLinkFeedback = {
    text: 'Link to the vote to share with others.',
    tone: 'default',
};

const PollPageContent = ({ pollRef }: PollPageContentProps): ReactElement => {
    const dispatch = useAppDispatch();
    const voteFormTitleId = useId();
    const voterNameDescriptionId = useId();
    const pollUrl = window.location.href;

    const {
        data: poll,
        error,
        isLoading,
    } = useGetPollQuery(pollRef, {
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
    const [shareLinkFeedback, setShareLinkFeedback] =
        useState<ShareLinkFeedback>(defaultShareLinkFeedback);
    const [closePollPendingFor, setClosePollPendingFor] = useState<
        string | null
    >(null);
    const isClosePollPendingRef = useRef<string | null>(null);
    const shareLinkFeedbackTimeoutRef = useRef<number | null>(null);
    const resolvedPollRef = poll?.id || poll?.slug || pollRef;
    const isPollEnded = Boolean(poll?.endedAt);
    const isClosePollPending = closePollPendingFor === resolvedPollRef;
    const isVoteLocked = useAppSelector((state) =>
        selectIsPollLocked(state, resolvedPollRef),
    );
    const organizerToken = useAppSelector((state) =>
        selectOrganizerToken(state, [
            poll?.id ?? '',
            poll?.slug ?? '',
            pollRef,
        ]),
    );
    const isVoteLockedInApp = isVoteLocked || hasSubmittedVote;
    const isVoteSubmissionLocked = isPollEnded || isVoteLockedInApp;
    const hasEnoughVotersToEndPoll =
        (poll?.voters.length ?? 0) >= MINIMUM_END_POLL_VOTERS;
    const pageTitle = poll ? poll.pollName : 'Vote';
    const pageDescription = poll
        ? buildPollSeoDescription({
              isEnded: isPollEnded,
              pollName: poll.pollName,
          })
        : 'Open a 1-10 score vote in okay.vote and share the results when you are ready.';
    const pageImagePath = poll
        ? buildPollOgImagePath(poll.slug ?? resolvedPollRef, {
              endedAt: poll.endedAt,
          })
        : undefined;
    const pageImageAlt = poll
        ? buildPollOgImageAlt(poll.pollName, {
              isEnded: isPollEnded,
          })
        : undefined;

    const setTransientShareLinkFeedback = (
        feedback: ShareLinkFeedback,
    ): void => {
        if (shareLinkFeedbackTimeoutRef.current !== null) {
            window.clearTimeout(shareLinkFeedbackTimeoutRef.current);
        }

        setShareLinkFeedback(feedback);
        shareLinkFeedbackTimeoutRef.current = window.setTimeout(() => {
            setShareLinkFeedback(defaultShareLinkFeedback);
            shareLinkFeedbackTimeoutRef.current = null;
        }, 2400);
    };

    const copyPollUrl = (feedbackText: string): boolean => {
        if (copy(pollUrl)) {
            setTransientShareLinkFeedback({
                text: feedbackText,
                tone: 'success',
            });

            return true;
        }

        setTransientShareLinkFeedback({
            text: 'Could not copy the link. Copy it manually from the field.',
            tone: 'destructive',
        });

        return false;
    };

    const onCopyPollUrl = (): void => {
        copyPollUrl('Link copied.');
    };

    const onSharePollUrl = async (): Promise<void> => {
        if (!poll) {
            return;
        }

        if (typeof navigator.share !== 'function') {
            copyPollUrl('Sharing is not available here. Link copied instead.');
            return;
        }

        try {
            await navigator.share({
                text: poll.pollName,
                title: poll.pollName,
                url: pollUrl,
            });
            setTransientShareLinkFeedback({
                text: 'Share sheet opened.',
                tone: 'success',
            });
        } catch (error: unknown) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }

            copyPollUrl('Could not open sharing. Link copied instead.');
        }
    };

    useEffect(() => {
        if (hasSubmittedVote) {
            dispatch(markPollAsVoted({ pollRef: resolvedPollRef }));
        }
    }, [dispatch, hasSubmittedVote, resolvedPollRef]);

    useEffect(
        () => () => {
            if (shareLinkFeedbackTimeoutRef.current !== null) {
                window.clearTimeout(shareLinkFeedbackTimeoutRef.current);
            }
        },
        [],
    );

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
        pollRef: resolvedPollRef,
        submitVote,
    });
    const voteErrorMessage = voteError ? renderError(voteError) : null;
    const endPollErrorMessage = endPollError ? renderError(endPollError) : null;
    const onVoteFormSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        onSubmit();
    };
    const onEndPoll = (): void => {
        if (
            !hasEnoughVotersToEndPoll ||
            isClosePollPendingRef.current === resolvedPollRef
        ) {
            return;
        }

        isClosePollPendingRef.current = resolvedPollRef;
        setClosePollPendingFor(resolvedPollRef);
        void endPoll({
            pollRef: resolvedPollRef,
            endPollData: {
                organizerToken: organizerToken ?? '',
            },
        })
            .unwrap()
            .catch(() => {
                isClosePollPendingRef.current = null;
                setClosePollPendingFor(null);
            });
    };

    return (
        <>
            <Seo
                description={pageDescription}
                imageAlt={pageImageAlt}
                imagePath={pageImagePath}
                title={pageTitle}
            />
            {!poll && isLoading && (
                <div className="flex min-h-[40vh] items-center justify-center">
                    <Panel className="loading-panel max-w-xl">
                        <Spinner className="size-10" />
                    </Panel>
                </div>
            )}
            {!poll && error && (
                <div className="mx-auto max-w-3xl">
                    <Panel className="space-y-4">
                        <div className="space-y-2">
                            <h1 className="page-title">Vote unavailable</h1>
                            <p className="field-note">
                                The requested vote could not be loaded.
                            </p>
                        </div>
                        <Alert announcement="assertive" variant="destructive">
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
                                        : `Score every option from 1 to 10. Each choice starts at ${DEFAULT_VOTE_SCORE}, and final results are calculated from the geometric mean of submitted votes.`}
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
                            {!isPollEnded && isVoteLockedInApp && (
                                <Alert announcement="polite" variant="success">
                                    <AlertDescription>
                                        <p className="font-medium text-foreground">
                                            You have voted successfully.
                                        </p>
                                    </AlertDescription>
                                </Alert>
                            )}
                            <SharePollLink
                                feedback={shareLinkFeedback}
                                onCopy={onCopyPollUrl}
                                onShare={() => {
                                    void onSharePollUrl();
                                }}
                                pollUrl={pollUrl}
                            />
                        </div>

                        {!isPollEnded && organizerToken && (
                            <OrganizerActions
                                endPollErrorMessage={endPollErrorMessage}
                                hasEnoughVotersToEndPoll={
                                    hasEnoughVotersToEndPoll
                                }
                                isEndingPoll={
                                    isEndingPoll || isClosePollPending
                                }
                                onEndPoll={onEndPoll}
                            />
                        )}
                    </Panel>

                    {isPollEnded && poll.results && (
                        <VoteResults results={poll.results} />
                    )}

                    {!isPollEnded && !isVoteLockedInApp && (
                        <VoteForm
                            choiceNames={poll.choices}
                            isSubmitEnabled={isSubmitEnabled}
                            isVoting={isVoting}
                            onSubmit={onVoteFormSubmit}
                            onVote={onVote}
                            selectedScores={selectedScores}
                            setVoterName={setVoterName}
                            voteErrorMessage={voteErrorMessage}
                            voteFormTitleId={voteFormTitleId}
                            voterName={voterName}
                            voterNameDescriptionId={voterNameDescriptionId}
                        />
                    )}

                    <ParticipantsPanel voters={poll.voters} />
                </div>
            )}
        </>
    );
};

export const PollPage = (): ReactElement => {
    const { pollRef } = useParams();

    if (!pollRef) {
        return <NotFound />;
    }

    return <PollPageContent pollRef={pollRef} />;
};

export default PollPage;
