import { type FormEvent, type ReactElement } from 'react';

import { DEFAULT_VOTE_SCORE } from '@okay-vote/contracts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Panel } from '@/components/ui/panel';

import LoadingButton from 'components/LoadingButton';
import VoteItem from 'components/VoteItem';

type VoteFormProps = {
    choiceNames: string[];
    isSubmitEnabled: boolean;
    isVoting: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onVote: (choiceName: string, score: number) => void;
    selectedScores: Record<string, number>;
    setVoterName: (value: string) => void;
    voteErrorMessage: string | null;
    voteFormTitleId: string;
    voterName: string;
    voterNameDescriptionId: string;
};

const VoteForm = ({
    choiceNames,
    isSubmitEnabled,
    isVoting,
    onSubmit,
    onVote,
    selectedScores,
    setVoterName,
    voteErrorMessage,
    voteFormTitleId,
    voterName,
    voterNameDescriptionId,
}: VoteFormProps): ReactElement => {
    return (
        <form
            aria-labelledby={voteFormTitleId}
            className="space-y-6"
            noValidate
            onSubmit={onSubmit}
        >
            <Panel className="space-y-6">
                <div className="space-y-2">
                    <h2
                        className="text-2xl font-semibold tracking-tight"
                        id={voteFormTitleId}
                    >
                        Cast your vote
                    </h2>
                    <p className="field-note">
                        {`Score choices from 1 to 10. Each choice starts at ${DEFAULT_VOTE_SCORE}, and final results are based on the geometric mean across all submitted votes.`}
                    </p>
                </div>
                <ul className="space-y-4">
                    {choiceNames.map((choiceName, choiceIndex) => (
                        <VoteItem
                            choiceIndex={choiceIndex}
                            choiceName={choiceName}
                            key={choiceName}
                            onVote={onVote}
                            selectedScore={selectedScores[choiceName]}
                        />
                    ))}
                </ul>
                <div className="space-y-4 border-t border-border pt-6">
                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                        <div className="grid gap-2">
                            <Label htmlFor="voterName">Voter name*</Label>
                            <Input
                                aria-describedby={voterNameDescriptionId}
                                id="voterName"
                                maxLength={32}
                                name="voterName"
                                onChange={({ target: { value } }) =>
                                    setVoterName(value)
                                }
                                required
                                value={voterName}
                            />
                            <p
                                className="field-note"
                                id={voterNameDescriptionId}
                            >
                                Your name appears in the participants list for
                                this vote.
                            </p>
                        </div>
                        <LoadingButton
                            className="w-full sm:mt-8 sm:w-auto sm:min-w-40"
                            disabled={!isSubmitEnabled}
                            loading={isVoting}
                            loadingLabel="Submitting vote"
                            size="lg"
                            type="submit"
                        >
                            Submit your choices
                        </LoadingButton>
                    </div>
                    {voteErrorMessage && (
                        <Alert announcement="assertive" variant="destructive">
                            <AlertDescription>
                                {voteErrorMessage}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </Panel>
        </form>
    );
};

export default VoteForm;
