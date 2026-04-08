import { type ReactElement } from 'react';

import { MINIMUM_END_POLL_VOTERS } from '@okay-vote/contracts';
import { Alert, AlertDescription } from '@/components/ui/alert';

import LoadingButton from 'components/LoadingButton';

type OrganizerActionsProps = {
    endPollErrorMessage: string | null;
    hasEnoughVotersToEndPoll: boolean;
    isEndingPoll: boolean;
    onEndPoll: () => void;
};

export const OrganizerActions = ({
    endPollErrorMessage,
    hasEnoughVotersToEndPoll,
    isEndingPoll,
    onEndPoll,
}: OrganizerActionsProps): ReactElement => {
    return (
        <div className="grid gap-3 border-t border-border pt-6">
            {endPollErrorMessage && (
                <Alert announcement="assertive" variant="destructive">
                    <AlertDescription>{endPollErrorMessage}</AlertDescription>
                </Alert>
            )}
            <div className="grid w-full gap-2">
                {!hasEnoughVotersToEndPoll && (
                    <p
                        className="field-note w-full text-left"
                        id="end-poll-helper-text"
                    >
                        At least {MINIMUM_END_POLL_VOTERS} people must vote
                        before you can close the poll and show results.
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
                        onClick={onEndPoll}
                        variant="default"
                    >
                        Close poll and show results
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
};

export default OrganizerActions;
