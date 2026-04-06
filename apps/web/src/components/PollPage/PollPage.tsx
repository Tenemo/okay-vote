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
        <main className="w-full pb-4">
            <Helmet>
                <title>{poll ? poll.pollName : 'Vote'}</title>
            </Helmet>
            <div className="mx-auto w-full max-w-3xl px-4">
                <div className="flex w-full justify-between">
                    <Button
                        className="m-2"
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
                    {poll?.results && !isResultsVisible && (
                        <Button
                            className="m-2"
                            onClick={() => setIsResultsVisible(true)}
                            variant="outline"
                        >
                            Show current results
                        </Button>
                    )}
                </div>
            </div>
            {!poll && isLoading && (
                <div className="mt-10 flex justify-center">
                    <Spinner className="size-8" />
                </div>
            )}
            {!poll && error && (
                <div className="mx-auto mt-2 w-full max-w-3xl px-4">
                    <Alert variant="destructive">
                        <AlertDescription>
                            {renderError(error)}
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            {poll && (
                <div className="mx-auto w-full max-w-3xl px-4">
                    <div className="w-full p-2">
                        <div className="relative">
                            <Input
                                aria-describedby="copy-page-link-helper-text"
                                className="pr-12"
                                readOnly
                                value={pollUrl}
                            />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        aria-label="Copy page link"
                                        className="absolute right-1 top-1/2 -translate-y-1/2"
                                        onClick={() => copy(pollUrl)}
                                        size="icon-sm"
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
                            className="mt-2 text-sm text-muted-foreground"
                            id="copy-page-link-helper-text"
                        >
                            Link to the vote to share with others
                        </p>
                    </div>

                    <h1 className="px-2 py-1 text-xl font-semibold tracking-tight">
                        {poll.pollName}
                    </h1>

                    {hasSubmittedVote && (
                        <p className="px-2 py-1 font-bold">
                            You have voted successfully.
                        </p>
                    )}
                    <p className="px-2 py-1 text-center">
                        {!hasSubmittedVote &&
                            'Rate choices from 1 to 10. You do not have to vote on every single item. The results will be ranked by geometric mean of all votes per item.'}{' '}
                        {!isResultsVisible &&
                            !poll.results &&
                            'Voting results are available when at least two participants have voted.'}
                    </p>
                    {!!poll.voters.length && (
                        <p className="px-2 py-1">
                            Voters who submitted their votes:{' '}
                            {poll.voters.join(', ')}.
                        </p>
                    )}

                    {isResultsVisible && poll.results && (
                        <VoteResults results={poll.results} />
                    )}
                    {!hasSubmittedVote && (
                        <>
                            <ul className="w-full list-none p-0">
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
                            <div className="flex flex-wrap items-end justify-center">
                                <div className="m-2 w-full sm:w-[280px]">
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
                                </div>
                                <LoadingButton
                                    className="m-2"
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
                                <Alert className="m-2" variant="destructive">
                                    <AlertDescription>
                                        {renderError(voteError)}
                                    </AlertDescription>
                                </Alert>
                            )}
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
