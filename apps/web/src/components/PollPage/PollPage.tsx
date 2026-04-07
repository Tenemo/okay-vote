import { type ReactElement, useState } from 'react';
import { useParams } from 'react-router-dom';
import copy from 'copy-to-clipboard';
import { Helmet } from 'react-helmet-async';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Copy, RotateCw } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import LoadingButton from 'components/LoadingButton';
import NotFound from 'components/NotFound';
import VoteItem from 'components/VoteItem';
import VoteResults from 'components/VoteResults';
import { useGetPollQuery, useVoteMutation } from 'store/pollsApi';
import { isUuid, renderError } from 'utils/utils';

type PollPageContentProps = {
    pollSlug: string;
};

const PollPageContent = ({ pollSlug }: PollPageContentProps): ReactElement => {
    const [selectedScores, setSelectedScores] = useState<
        Record<string, number>
    >({});
    const [voterName, setVoterName] = useState('');
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

    const onVote = (choiceName: string, score: number): void => {
        setSelectedScores((currentScores) => ({
            ...currentScores,
            [choiceName]: score,
        }));
    };

    const onReload = (): void => {
        void refetch();
    };

    const onSubmit = (): void => {
        if (!poll) {
            return;
        }

        void submitVote({
            pollId: poll.id,
            voteData: {
                votes: selectedScores,
                voterName: voterName.trim(),
            },
        });
    };

    const isSubmitEnabled =
        Object.keys(selectedScores).length > 0 &&
        voterName.trim().length > 0 &&
        !isVoting;

    return (
        <main className="w-full">
            <Helmet>
                <title>{poll ? poll.pollName : 'Vote'}</title>
            </Helmet>
            {!poll && isLoading && (
                <div className="page-shell flex items-center justify-center">
                    <Spinner className="size-8" />
                </div>
            )}
            {!poll && error && (
                <div className="page-shell">
                    <Alert variant="destructive">
                        <AlertDescription>
                            {renderError(error)}
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            {poll && (
                <div className="page-shell">
                    <section className="surface-card space-y-6">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <h1 className="page-title">
                                        {poll.pollName}
                                    </h1>
                                    <p className="page-lead">
                                        {!hasSubmittedVote &&
                                            'Rate every option on a scale from 1 to 10. You can skip choices you do not want to score, and the ranking is calculated from the geometric mean of submitted votes.'}{' '}
                                        {!isResultsVisible &&
                                            !poll.results &&
                                            'Results appear after at least two participants have submitted votes.'}
                                    </p>
                                    {hasSubmittedVote && (
                                        <p className="text-base font-medium text-foreground">
                                            You have voted successfully.
                                        </p>
                                    )}
                                    {!!poll.voters.length && (
                                        <p className="field-note">
                                            Voters who submitted their votes:{' '}
                                            {poll.voters.join(', ')}.
                                        </p>
                                    )}
                                </div>

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
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    aria-label="Copy page link"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                                    onClick={() =>
                                                        copy(pollUrl)
                                                    }
                                                    size="icon"
                                                    type="button"
                                                    variant="ghost"
                                                >
                                                    <Copy className="size-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent sideOffset={4}>
                                                <p>Copy to clipboard</p>
                                            </TooltipContent>
                                        </Tooltip>
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
                    </section>

                    {isResultsVisible && poll.results && (
                        <VoteResults results={poll.results} />
                    )}

                    {!hasSubmittedVote && (
                        <>
                            <ul className="grid list-none gap-4 p-0">
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

                            <section className="surface-card space-y-5">
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
                                        value={voterName}
                                    />
                                    <p className="field-note">
                                        Use the same name each time so repeat
                                        submissions can be detected correctly.
                                    </p>
                                </div>

                                {voteError && (
                                    <Alert variant="destructive">
                                        <AlertDescription>
                                            {renderError(voteError)}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                    <LoadingButton
                                        className="w-full sm:w-auto sm:min-w-64"
                                        disabled={!isSubmitEnabled}
                                        loading={isVoting}
                                        loadingLabel="Submitting vote"
                                        onClick={onSubmit}
                                        size="lg"
                                    >
                                        Submit your choices
                                    </LoadingButton>
                                </div>
                            </section>
                        </>
                    )}
                </div>
            )}
        </main>
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
