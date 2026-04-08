import {
    type FormEvent,
    type KeyboardEvent,
    type ReactElement,
    useId,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from '@/components/ui/icons';
import { Label } from '@/components/ui/label';
import { Panel } from '@/components/ui/panel';

import LoadingButton from 'components/LoadingButton';
import Seo from 'components/Seo';
import { useAppDispatch } from 'store/hooks';
import { storeOrganizerToken } from 'store/organizerTokensSlice';
import { useCreatePollMutation, useLazyGetPollQuery } from 'store/pollsApi';
import { usePollCreation } from './usePollCreation';

export const PollCreationPage = (): ReactElement => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const pageTitleId = useId();
    const pollNameDescriptionId = useId();
    const choiceNameDescriptionId = useId();
    const [createPoll, { isLoading, error }] = useCreatePollMutation();
    const [getPollByRef] = useLazyGetPollQuery();
    const {
        choiceName,
        choices,
        displayedCreatePollError,
        isChoiceDuplicate,
        isChoiceNameValid,
        isCreatingPoll,
        isFormValid,
        onAddChoice,
        onCreatePoll,
        onFormChange,
        onRemoveChoice,
        pollName,
    } = usePollCreation({
        createPoll,
        createPollMutationError: error,
        getPollByRef,
        onCreatePollSuccess: ({ createdPoll, createdPollPath }) => {
            const pollRefs = [createdPoll.id];

            if (createdPoll.slug) {
                pollRefs.push(createdPoll.slug);
            }

            dispatch(
                storeOrganizerToken({
                    organizerToken: createdPoll.organizerToken,
                    pollRefs,
                }),
            );
            void navigate(createdPollPath);
        },
    });
    const isCreatePollMutationLoading = isLoading;
    const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        onCreatePoll();
    };
    const onChoiceNameKeyDown = (
        event: KeyboardEvent<HTMLInputElement>,
    ): void => {
        if (
            event.key !== 'Enter' ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
        ) {
            return;
        }

        event.preventDefault();
        onAddChoice();
    };

    return (
        <>
            <Seo
                description="Create and share a 1-10 score vote in okay.vote, collect responses, and reveal results when you are ready."
                title="Create a vote"
            />
            <section className="mx-auto w-full max-w-3xl space-y-6 sm:space-y-8">
                <div className="space-y-3 text-center">
                    <h1 className="page-title" id={pageTitleId}>
                        Create a new vote
                    </h1>
                    <p className="page-lead mx-auto max-w-2xl">
                        Set up a simple 1-10 score vote, add the options people
                        can score, and share the generated link once everything
                        looks right.
                    </p>
                </div>

                <form
                    aria-labelledby={pageTitleId}
                    className="space-y-6"
                    noValidate
                    onSubmit={onSubmit}
                >
                    <Panel className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="pollName">Vote name</Label>
                            <Input
                                aria-describedby={pollNameDescriptionId}
                                autoComplete="off"
                                id="pollName"
                                maxLength={64}
                                name="pollName"
                                onChange={onFormChange}
                                required
                                value={pollName}
                            />
                            <p
                                className="field-note"
                                id={pollNameDescriptionId}
                            >
                                What would you like to vote on?
                            </p>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2 text-center">
                                <h2 className="text-xl font-semibold tracking-tight">
                                    Choices
                                </h2>
                                <p className="field-note">
                                    Each participant will score every option
                                    from 1 to 10.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                                <div className="grid gap-2">
                                    <Label htmlFor="choiceName">
                                        Choice to vote for
                                    </Label>
                                    <Input
                                        aria-describedby={
                                            choiceNameDescriptionId
                                        }
                                        aria-invalid={isChoiceDuplicate}
                                        autoComplete="off"
                                        id="choiceName"
                                        maxLength={64}
                                        onChange={onFormChange}
                                        onKeyDown={onChoiceNameKeyDown}
                                        value={choiceName}
                                    />
                                </div>
                                <Button
                                    className="w-full sm:w-auto"
                                    disabled={!isChoiceNameValid}
                                    onClick={onAddChoice}
                                    type="button"
                                    variant={
                                        isChoiceNameValid
                                            ? 'default'
                                            : 'outline'
                                    }
                                >
                                    <Plus className="size-4" />
                                    Add new choice
                                </Button>
                            </div>
                            <p
                                aria-live="polite"
                                className={`field-note ${
                                    isChoiceDuplicate ? 'text-destructive' : ''
                                }`}
                                id={choiceNameDescriptionId}
                            >
                                {isChoiceDuplicate
                                    ? 'This choice already exists.'
                                    : 'Each choice becomes an option that voters can score from 1 to 10.'}
                            </p>

                            {choices.length === 0 ? (
                                <p className="empty-state">
                                    To create a vote, add choices that each
                                    participant will be able to score from 1 to
                                    10.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-secondary">
                                        Choices currently in the vote:
                                    </p>
                                    <ul className="space-y-2">
                                        {choices.map((choice) => (
                                            <li
                                                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border/70 bg-background/30 px-4 py-3"
                                                key={choice}
                                            >
                                                <span
                                                    className="block min-w-0 truncate text-base font-medium"
                                                    title={choice}
                                                >
                                                    {choice}
                                                </span>
                                                <Button
                                                    aria-label={`Delete ${choice}`}
                                                    onClick={() =>
                                                        onRemoveChoice(choice)
                                                    }
                                                    size="icon"
                                                    type="button"
                                                    variant="ghost"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {choices.length === 1 && (
                                <p className="field-note">
                                    There need to be at least two possible
                                    choices in a vote.
                                </p>
                            )}
                        </div>
                    </Panel>

                    {displayedCreatePollError && (
                        <Alert announcement="assertive" variant="destructive">
                            <AlertDescription>
                                {displayedCreatePollError}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-end">
                        <LoadingButton
                            className="w-full sm:w-auto"
                            disabled={!isFormValid}
                            loading={
                                isCreatingPoll || isCreatePollMutationLoading
                            }
                            loadingLabel="Creating vote"
                            size="lg"
                            type="submit"
                        >
                            Create vote
                        </LoadingButton>
                    </div>
                </form>
            </section>
        </>
    );
};

export default PollCreationPage;
