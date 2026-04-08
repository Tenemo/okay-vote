import { type ReactElement, useState } from 'react';
import { useParams } from 'react-router-dom';
import copy from 'copy-to-clipboard';
import { Helmet } from 'react-helmet-async';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Copy, RotateCw } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Panel } from '@/components/ui/panel';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

import LoadingButton from 'components/LoadingButton';
import NotFound from 'components/NotFound';
import VoteItem from 'components/VoteItem';
import VoteResults from 'components/VoteResults';
import { useGetPollQuery, useVoteMutation } from 'store/pollsApi';
import { isUuid, renderError } from 'utils/utils';
import { useVoteSubmission } from './useVoteSubmission';

type PollPageContentProps = {
    pollSlug: string;
};

const PollPageContent = ({ pollSlug }: PollPageContentProps): ReactElement => {
    const [isResultsVisible, setIsResultsVisible] = useState(false);
    const pollUrl = window.location.href;

    const {
        data: poll,
        error,
        isFetching,
        isLoading,
        refetch,
    } = useGetPollQuery(pollSlug, {
        pollingInterval: 3000,
        refetchOnFocus: true,
        refetchOnReconnect: true,
        skipPollingIfUnfocused: true,
    });
    const [
        submitVote,
        { error: voteError, isLoading: isVoting, isSuccess: hasSubmittedVote },
    ] = useVoteMutation();
    const {
        isSubmitEnabled,
        onSubmit,
        onVote,
        selectedScores,
        setVoterName,
        voterName,
    } = useVoteSubmission({
        hasSubmittedVote,
        isVoting,
        pollId: poll?.id ?? '',
        submitVote,
    });

    const onReload = (): void => {
        void refetch();
    };

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
                    <Panel className="space-y-6">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-secondary">
                                        Vote
                                    </p>
                                    <h1 className="page-title">
                                        {poll.pollName}
                                    </h1>
                                    <p className="page-lead max-w-3xl">
                                        {!hasSubmittedVote &&
                                            'Rate every option on a scale from 1 to 10. You can skip choices you do not want to score, and the ranking is calculated from the geometric mean of submitted votes.'}{' '}
                                        {!isResultsVisible &&
                                            !poll.results &&
                                            'Results appear after at least two participants have submitted votes.'}
                                    </p>
                                </div>
                                {hasSubmittedVote && (
                                    <Alert>
                                        <AlertDescription>
                                            <p className="font-medium text-foreground">
                                                You have voted successfully.
                                            </p>
                                            <p className="field-note">
                                                You can submit more scores later
                                                with the same voter name.
                                            </p>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="pollUrl">
                                        Share vote link
                                    </Label>
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

                            <div className="grid w-full gap-3 sm:w-auto sm:min-w-56">
                                <Button
                                    className="w-full"
                                    disabled={isFetching}
                                    onClick={onReload}
                                    variant="outline"
                                >
                                    <RotateCw
                                        className={cn(
                                            'size-4',
                                            isFetching && 'animate-spin',
                                        )}
                                    />
                                    Refresh vote
                                </Button>
                                {poll.results && !isResultsVisible && (
                                    <Button
                                        className="w-full"
                                        onClick={() =>
                                            setIsResultsVisible(true)
                                        }
                                        variant="outline"
                                    >
                                        Show current results
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Panel>

                    {isResultsVisible && poll.results && (
                        <VoteResults results={poll.results} />
                    )}

                    <Panel className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Cast your vote
                            </h2>
                            <p className="field-note">
                                Rate choices from 1 to 10. You can skip any
                                option you do not want to score, and the final
                                ranking will be based on the geometric mean
                                across all submitted votes.
                            </p>
                        </div>
                        <ul className="space-y-4">
                            {poll.choices.map((choiceName: string) => (
                                <VoteItem
                                    choiceName={choiceName}
                                    key={choiceName}
                                    onVote={onVote}
                                    selectedScore={selectedScores[choiceName]}
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
                                        Use the same name each time so repeat
                                        submissions can be detected correctly.
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

    if (!pollSlug || isUuid(pollSlug)) {
        return <NotFound />;
    }

    return <PollPageContent pollSlug={pollSlug} />;
};

export default PollPage;
