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
    const choiceNameDescriptionId = useId();
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
        <main className="w-full">
            <Helmet>
                <title>Vote creation</title>
            </Helmet>
            <div className="page-shell">
                <header className="page-header">
                    <h1 className="page-title">Create a new vote</h1>
                    <p className="page-lead">
                        Set up a simple score-based vote, add the options people
                        can rank, and share the generated link once everything
                        looks right.
                    </p>
                </header>

                <section className="surface-card space-y-6">
                    <div className="grid gap-2">
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
                        <p className="field-note">
                            What would you like to vote on?
                        </p>
                    </div>

                    <div className="grid gap-3">
                        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                            <div className="grid gap-2">
                                <Label htmlFor="choiceName">
                                    Choice to vote for
                                </Label>
                                <Input
                                    aria-describedby={choiceNameDescriptionId}
                                    aria-invalid={isChoiceDuplicate}
                                    autoComplete="off"
                                    id="choiceName"
                                    maxLength={64}
                                    onChange={onFormChange}
                                    onKeyDown={onChoiceKeyDown}
                                    value={choiceName}
                                />
                            </div>
                            <Button
                                className="w-full sm:w-auto sm:min-w-48"
                                disabled={!isChoiceNameValid}
                                onClick={onAddChoice}
                                variant="outline"
                            >
                                <Plus className="size-4" />
                                Add new choice
                            </Button>
                        </div>
                        <p
                            className={`field-note ${
                                isChoiceDuplicate
                                    ? 'text-destructive-foreground'
                                    : ''
                            }`}
                            id={choiceNameDescriptionId}
                        >
                            {isChoiceDuplicate
                                ? 'This choice already exists.'
                                : 'Each choice becomes an option that voters can score from 1 to 10.'}
                        </p>
                    </div>

                    <section className="rounded-xl border border-border/70 bg-background/30 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold tracking-tight">
                                    Choices
                                </h2>
                                <p className="field-note">
                                    Add at least two options before creating the
                                    vote.
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {choices.length}{' '}
                                {choices.length === 1 ? 'choice' : 'choices'}
                            </p>
                        </div>

                        {choices.length === 0 ? (
                            <p className="mt-4 text-base leading-7 text-muted-foreground">
                                To create a vote, add choices that each
                                participant will be able to rank from 1 to 10.
                            </p>
                        ) : (
                            <ul className="mt-4 grid gap-3">
                                {choices.map((choice) => (
                                    <li
                                        className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/35 px-4 py-3"
                                        key={choice}
                                    >
                                        <span className="text-base font-medium">
                                            {choice}
                                        </span>
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
                        )}

                        {choices.length === 1 && (
                            <p className="field-note mt-4">
                                There need to be at least two possible choices
                                in a vote.
                            </p>
                        )}
                    </section>

                    {displayedCreatePollError && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                {displayedCreatePollError}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <LoadingButton
                            className="w-full sm:w-auto sm:min-w-48"
                            disabled={!isFormValid}
                            loading={isCreatingPoll}
                            loadingLabel="Creating vote"
                            onClick={onCreatePoll}
                            size="lg"
                        >
                            Create vote
                        </LoadingButton>
                    </div>
                </section>
            </div>
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
