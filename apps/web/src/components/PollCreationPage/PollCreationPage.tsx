import {
    type ChangeEvent,
    type KeyboardEvent,
    type ReactElement,
    useId,
    useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import type { CreatePollResponse } from '@okay-vote/contracts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from '@/components/ui/icons';
import { Label } from '@/components/ui/label';

import LoadingButton from 'components/LoadingButton';
import { useCreatePollMutation, useLazyGetPollQuery } from 'store/pollsApi';
import { renderError } from 'utils/utils';

type Form = {
    pollName: string;
    choiceName: string;
};

type CreatePollResponseCompat = Omit<CreatePollResponse, 'slug'> & {
    slug?: string;
};

const normalizePollName = (pollName: string): string => pollName.trim();

const normalizeChoiceName = (choiceName: string): string => choiceName.trim();

const initialForm = {
    pollName: '',
    choiceName: '',
};

export const PollCreationPage = (): ReactElement => {
    const navigate = useNavigate();
    const createdPollDialogTitleId = useId();
    const createdPollDialogDescriptionId = useId();
    const [createPoll, { isLoading, error }] = useCreatePollMutation();
    const [getPollByRef] = useLazyGetPollQuery();

    const [choices, setChoices] = useState<string[]>([]);
    const [createdPoll, setCreatedPoll] = useState<CreatePollResponse | null>(
        null,
    );
    const [createPollError, setCreatePollError] = useState<string | null>(null);
    const [isResolvingCreatedPoll, setIsResolvingCreatedPoll] = useState(false);
    const [form, setForm] = useState<Form>(initialForm);
    const { pollName, choiceName } = form;
    const normalizedPollName = normalizePollName(pollName);
    const normalizedChoiceName = normalizeChoiceName(choiceName);
    const isChoiceDuplicate =
        normalizedChoiceName.length > 0 &&
        choices.includes(normalizedChoiceName);
    const isChoiceNameValid =
        normalizedChoiceName.length > 0 && !isChoiceDuplicate;
    const isCreatingPoll = isLoading || isResolvingCreatedPoll;
    const isFormValid =
        normalizedPollName.length > 0 && choices.length > 1 && !isCreatingPoll;
    const createdPollPath = createdPoll ? `/votes/${createdPoll.slug}` : '';
    const createdPollUrl = createdPoll
        ? new URL(createdPollPath, window.location.origin).toString()
        : '';
    const displayedCreatePollError =
        createPollError ?? (error ? renderError(error) : null);

    const onFormChange = ({
        target: { id, value },
    }: ChangeEvent<HTMLInputElement>): void =>
        setForm((currentForm) => ({ ...currentForm, [id]: value }));

    const onRemoveChoice = (choice: string): void =>
        setChoices((currentChoices) =>
            currentChoices.filter((currentChoice) => currentChoice !== choice),
        );

    const onCreatePoll = (): void => {
        setCreatePollError(null);
        void createPoll({ choices, pollName: normalizedPollName })
            .unwrap()
            .then(async (response) => {
                const createdPollResponse =
                    response as CreatePollResponseCompat;

                if (createdPollResponse.slug) {
                    setCreatedPoll({
                        ...createdPollResponse,
                        slug: createdPollResponse.slug,
                    });
                    return;
                }

                setIsResolvingCreatedPoll(true);

                try {
                    const resolvedPoll = await getPollByRef(
                        createdPollResponse.id,
                        true,
                    ).unwrap();

                    setCreatedPoll({
                        ...createdPollResponse,
                        slug: resolvedPoll.slug,
                    });
                } catch (caughtError) {
                    setCreatePollError(
                        renderError(
                            caughtError as Parameters<typeof renderError>[0],
                        ),
                    );
                } finally {
                    setIsResolvingCreatedPoll(false);
                }
            });
    };

    const onClear = (): void => {
        setChoices([]);
        setForm(initialForm);
        setCreatedPoll(null);
        setCreatePollError(null);
    };

    const onAddChoice = (): void => {
        if (!isChoiceNameValid) {
            return;
        }

        setChoices((currentChoices) => [
            ...currentChoices,
            normalizedChoiceName,
        ]);
        setForm((currentForm) => ({ ...currentForm, choiceName: '' }));
    };

    const onChoiceKeyDown = ({
        key,
    }: KeyboardEvent<HTMLInputElement>): void => {
        if (key === 'Enter') {
            onAddChoice();
        }
    };

    return (
        <main className="w-full pb-4">
            <Helmet>
                <title>Vote creation</title>
            </Helmet>
            <h1 className="mb-2 mt-4 px-2 text-center text-xl font-semibold tracking-tight">
                Create a new vote
            </h1>
            <div className="mx-auto w-full max-w-3xl px-4 pb-1">
                <div className="w-full">
                    <Label htmlFor="pollName">Vote name</Label>
                    <Input
                        autoComplete="off"
                        id="pollName"
                        maxLength={64}
                        name="pollName"
                        onChange={onFormChange}
                        required
                        value={pollName}
                    />
                    <p className="min-h-5 pt-1 text-sm text-muted-foreground">
                        {pollName ? '' : 'What would you like to vote on?'}
                    </p>
                </div>
            </div>
            <div className="mx-auto w-full max-w-3xl px-4">
                <div className="w-full rounded-md bg-accent p-4 sm:p-6">
                    <div className="flex min-h-[100px] flex-wrap items-start justify-center gap-4">
                        <div className="w-full sm:w-[280px]">
                            <Label htmlFor="choiceName">
                                Choice to vote for
                            </Label>
                            <Input
                                aria-invalid={isChoiceDuplicate}
                                autoComplete="off"
                                id="choiceName"
                                maxLength={64}
                                onChange={onFormChange}
                                onKeyDown={onChoiceKeyDown}
                                value={choiceName}
                            />
                            <p className="min-h-5 pt-1 text-sm text-destructive">
                                {isChoiceDuplicate
                                    ? 'This choice already exists'
                                    : ''}
                            </p>
                        </div>
                        <Button
                            disabled={!isChoiceNameValid}
                            onClick={onAddChoice}
                            variant="outline"
                        >
                            <Plus className="size-4" />
                            Add new choice
                        </Button>
                    </div>
                    {choices.length === 0 && (
                        <p className="m-1">
                            To create a vote, add choices that each participant
                            will be able to rank from 1 to 10.
                        </p>
                    )}
                    {!!choices.length && (
                        <>
                            <p className="m-1">
                                Choices currently in the vote:
                            </p>
                            <ul className="px-2 py-1">
                                {choices.map((choice) => (
                                    <li
                                        className="my-2 flex items-center justify-between rounded-md border border-secondary px-4 py-2"
                                        key={choice}
                                    >
                                        <span>{choice}</span>
                                        <Button
                                            aria-label={`Delete ${choice}`}
                                            onClick={() =>
                                                onRemoveChoice(choice)
                                            }
                                            size="icon"
                                            variant="ghost"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    {choices.length === 1 && (
                        <p className="m-1">
                            There need to be at least two possible choices in a
                            vote.
                        </p>
                    )}
                </div>
            </div>
            <div className="flex justify-center">
                <LoadingButton
                    className="m-2"
                    disabled={!isFormValid}
                    loading={isCreatingPoll}
                    loadingLabel="Creating vote"
                    onClick={onCreatePoll}
                    size="lg"
                >
                    Create vote
                </LoadingButton>
            </div>
            {displayedCreatePollError && (
                <div className="mx-auto mt-2 w-full max-w-3xl px-4">
                    <Alert variant="destructive">
                        <AlertDescription>
                            {displayedCreatePollError}
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            <Dialog open={!!createdPoll}>
                <DialogContent
                    aria-describedby={createdPollDialogDescriptionId}
                    aria-labelledby={createdPollDialogTitleId}
                    onEscapeKeyDown={(event) => event.preventDefault()}
                    onPointerDownOutside={(event) => event.preventDefault()}
                    showCloseButton={false}
                >
                    <DialogHeader>
                        <DialogTitle id={createdPollDialogTitleId}>
                            Vote successfully created!
                        </DialogTitle>
                        <DialogDescription id={createdPollDialogDescriptionId}>
                            Your vote link:{' '}
                            <a
                                className="underline"
                                href={createdPollUrl}
                                rel="noreferrer"
                                target="_blank"
                            >
                                {createdPollUrl}
                            </a>
                            {'. '}
                            Would you like to go to the newly created vote?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => onClear()} variant="outline">
                            Back to vote creation
                        </Button>
                        <Button
                            autoFocus
                            onClick={() => {
                                if (!createdPoll) {
                                    return;
                                }

                                onClear();
                                void navigate(createdPollPath);
                            }}
                        >
                            Go to vote
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
};

export default PollCreationPage;
