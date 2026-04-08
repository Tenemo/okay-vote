import { useState, type ChangeEvent, type KeyboardEvent } from 'react';

import type {
    CreatePollRequest,
    CreatePollResponse,
    PollResponse,
} from '@okay-vote/contracts';

import { renderError } from 'utils/utils';

type Form = {
    pollName: string;
    choiceName: string;
};

type CreatePollResponseCompat = Omit<CreatePollResponse, 'slug'> & {
    slug?: string;
};

type CreatePollTrigger = (payload: CreatePollRequest) => {
    unwrap: () => Promise<CreatePollResponseCompat>;
};

type GetPollByRefTrigger = (
    pollRef: string,
    preferCacheValue?: boolean,
) => {
    unwrap: () => Promise<Partial<Pick<PollResponse, 'slug'>>>;
};

type UsePollCreationArgs = {
    createPoll: CreatePollTrigger;
    createPollMutationError: Parameters<typeof renderError>[0];
    getPollByRef: GetPollByRefTrigger;
    onCreatePollSuccess: (payload: {
        createdPoll: CreatePollResponseCompat;
        createdPollPath: string;
    }) => void;
};

type UsePollCreationResult = {
    choiceName: string;
    choices: string[];
    displayedCreatePollError: string | null;
    isChoiceDuplicate: boolean;
    isChoiceNameValid: boolean;
    isCreatingPoll: boolean;
    isFormValid: boolean;
    onAddChoice: () => void;
    onChoiceKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    onCreatePoll: () => void;
    onFormChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onRemoveChoice: (choice: string) => void;
    pollName: string;
};

const hasSlug = (slug: string | undefined): slug is string =>
    typeof slug === 'string' && slug.length > 0;

const getCreatedPollRef = (createdPoll: CreatePollResponseCompat): string =>
    hasSlug(createdPoll.slug) ? createdPoll.slug : createdPoll.id;

const getCreatedPollPath = (createdPoll: CreatePollResponseCompat): string =>
    `/votes/${getCreatedPollRef(createdPoll)}`;

const initialForm: Form = {
    pollName: '',
    choiceName: '',
};

const normalizePollName = (pollName: string): string => pollName.trim();

const normalizeChoiceName = (choiceName: string): string => choiceName.trim();

export const usePollCreation = ({
    createPoll,
    createPollMutationError,
    getPollByRef,
    onCreatePollSuccess,
}: UsePollCreationArgs): UsePollCreationResult => {
    const [choices, setChoices] = useState<string[]>([]);
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
    const isCreatingPoll = isResolvingCreatedPoll;
    const isFormValid =
        normalizedPollName.length > 0 && choices.length > 1 && !isCreatingPoll;
    const displayedCreatePollError =
        createPollError ??
        (createPollMutationError ? renderError(createPollMutationError) : null);

    const onFormChange = ({
        target: { id, value },
    }: ChangeEvent<HTMLInputElement>): void => {
        if (id !== 'pollName' && id !== 'choiceName') {
            return;
        }

        setForm((currentForm) => ({ ...currentForm, [id]: value }));
    };

    const onRemoveChoice = (choice: string): void =>
        setChoices((currentChoices) =>
            currentChoices.filter((currentChoice) => currentChoice !== choice),
        );

    const onCreatePoll = (): void => {
        const run = async (): Promise<void> => {
            setCreatePollError(null);

            try {
                const createdPollResponse = await createPoll({
                    choices,
                    pollName: normalizedPollName,
                }).unwrap();

                if (createdPollResponse.slug) {
                    onCreatePollSuccess({
                        createdPoll: {
                            ...createdPollResponse,
                            slug: createdPollResponse.slug,
                        },
                        createdPollPath:
                            getCreatedPollPath(createdPollResponse),
                    });
                    return;
                }

                setIsResolvingCreatedPoll(true);

                try {
                    const resolvedPoll = await getPollByRef(
                        createdPollResponse.id,
                        true,
                    ).unwrap();

                    const createdPoll = {
                        ...createdPollResponse,
                        ...(hasSlug(resolvedPoll.slug)
                            ? { slug: resolvedPoll.slug }
                            : {}),
                    };

                    onCreatePollSuccess({
                        createdPoll,
                        createdPollPath: getCreatedPollPath(createdPoll),
                    });
                } finally {
                    setIsResolvingCreatedPoll(false);
                }
            } catch (caughtError) {
                setCreatePollError(
                    renderError(
                        caughtError as Parameters<typeof renderError>[0],
                    ),
                );
            }
        };

        void run();
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

    return {
        choiceName,
        choices,
        displayedCreatePollError,
        isChoiceDuplicate,
        isChoiceNameValid,
        isCreatingPoll,
        isFormValid,
        onAddChoice,
        onChoiceKeyDown,
        onCreatePoll,
        onFormChange,
        onRemoveChoice,
        pollName,
    };
};
