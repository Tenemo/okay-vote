import {
    type ChangeEvent,
    type KeyboardEvent,
    type ReactElement,
    useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import {
    useTheme,
    Typography,
    ListItemText,
    ListItem,
    List,
    Box,
    Button,
    TextField,
    IconButton,
    Alert,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Link,
    Grid,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';

import type { CreatePollResponse } from '@okay-vote/contracts';

import { useCreatePollMutation } from 'store/pollsApi';
import { renderError } from 'utils/utils';

type Form = {
    pollName: string;
    choiceName: string;
};

const normalizePollName = (pollName: string): string => pollName.trim();

const normalizeChoiceName = (choiceName: string): string => choiceName.trim();

const initialForm = {
    pollName: '',
    choiceName: '',
};

export const PollCreationPage = (): ReactElement => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [createPoll, { isLoading, error }] = useCreatePollMutation();

    const [choices, setChoices] = useState<string[]>([]);
    const [createdPoll, setCreatedPoll] = useState<CreatePollResponse | null>(
        null,
    );
    const [form, setForm] = useState<Form>(initialForm);
    const { pollName, choiceName } = form;
    const normalizedPollName = normalizePollName(pollName);
    const normalizedChoiceName = normalizeChoiceName(choiceName);
    const isChoiceDuplicate =
        normalizedChoiceName.length > 0 &&
        choices.includes(normalizedChoiceName);
    const isChoiceNameValid =
        normalizedChoiceName.length > 0 && !isChoiceDuplicate;
    const isFormValid =
        normalizedPollName.length > 0 && choices.length > 1 && !isLoading;
    const createdPollPath = createdPoll ? `/votes/${createdPoll.id}` : '';
    const createdPollUrl = createdPoll
        ? new URL(createdPollPath, window.location.origin).toString()
        : '';

    const onFormChange = ({
        target: { id, value },
    }: ChangeEvent<HTMLInputElement>): void =>
        setForm((currentForm) => ({ ...currentForm, [id]: value }));

    const onRemoveChoice = (choice: string): void =>
        setChoices((currentChoices) =>
            currentChoices.filter((currentChoice) => currentChoice !== choice),
        );

    const onCreatePoll = (): void => {
        void createPoll({ choices, pollName: normalizedPollName })
            .unwrap()
            .then((response) => {
                setCreatedPoll(response);
            });
    };

    const onClear = (): void => {
        setChoices([]);
        setForm(initialForm);
        setCreatedPoll(null);
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
        <Box
            component="main"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <Helmet>
                <title>Vote creation</title>
            </Helmet>
            <Typography
                sx={{
                    mb: 2,
                    mt: 4,
                }}
                variant="h5"
            >
                Create a new vote
            </Typography>
            <Grid
                container
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <Grid
                    size={{
                        sm: 10,
                        md: 8,
                        lg: 6,
                        xl: 4,
                    }}
                    sx={{ width: '100%', p: 1 }}
                >
                    <TextField
                        autoComplete="off"
                        helperText={
                            pollName ? '' : 'What would you like to vote on?'
                        }
                        id="pollName"
                        inputProps={{ maxLength: 64 }}
                        label="Vote name"
                        name="pollName"
                        onChange={onFormChange}
                        required
                        sx={{ mb: 1, minHeight: 80, width: '100%' }}
                        value={pollName}
                    />
                </Grid>
            </Grid>
            <Grid
                container
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <Grid
                    size={{
                        sm: 10,
                        md: 8,
                        lg: 6,
                        xl: 4,
                    }}
                    sx={{
                        width: '100%',
                        p: 1,
                        backgroundColor: theme.palette.action.hover,
                        borderRadius: 1,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            minHeight: 100,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <TextField
                            autoComplete="off"
                            error={isChoiceDuplicate}
                            helperText={
                                isChoiceDuplicate
                                    ? 'This choice already exists'
                                    : undefined
                            }
                            id="choiceName"
                            inputProps={{ maxLength: 64 }}
                            label="Choice to vote for"
                            onChange={onFormChange}
                            onKeyDown={onChoiceKeyDown}
                            sx={{ m: 1, alignSelf: 'flex-start' }}
                            value={choiceName}
                        />
                        <Button
                            disabled={!isChoiceNameValid}
                            onClick={onAddChoice}
                            startIcon={<AddIcon />}
                            sx={{ m: 1, mb: 2 }}
                            variant="outlined"
                        >
                            Add new choice
                        </Button>
                    </Box>
                    {choices.length === 0 && (
                        <Typography sx={{ m: 1 }} variant="body1">
                            To create a vote, add choices that each participant
                            will be able to rank from 1 to 10.
                        </Typography>
                    )}
                    {!!choices.length && (
                        <>
                            <Typography sx={{ m: 1 }} variant="body1">
                                Choices currently in the vote:
                            </Typography>
                            <List sx={{ px: 2, py: 1 }}>
                                {choices.map((choice) => (
                                    <ListItem
                                        key={choice}
                                        secondaryAction={
                                            <IconButton
                                                aria-label="delete"
                                                edge="end"
                                                onClick={() =>
                                                    onRemoveChoice(choice)
                                                }
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        }
                                        sx={{
                                            border: `1px solid ${theme.palette.secondary.main}`,
                                            borderRadius: 1,
                                            my: 1,
                                        }}
                                    >
                                        <ListItemText primary={choice} />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}
                    {choices.length === 1 && (
                        <Typography sx={{ m: 1 }} variant="body1">
                            There need to be at least two possible choices in a
                            vote.
                        </Typography>
                    )}
                </Grid>
            </Grid>
            <Button
                disabled={!isFormValid}
                onClick={onCreatePoll}
                size="large"
                sx={{ m: 2 }}
                variant="contained"
            >
                Create vote
            </Button>
            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {renderError(error)}
                </Alert>
            )}
            {isLoading && <CircularProgress sx={{ mt: 2 }} />}
            <Dialog
                aria-describedby="created-poll-dialog-description"
                aria-labelledby="created-poll-dialog-title"
                open={!!createdPoll}
            >
                <DialogTitle id="created-poll-dialog-title">
                    Vote successfully created!
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="created-poll-dialog-description">
                        Your vote link:{' '}
                        <Link
                            href={createdPollUrl}
                            rel="noreferrer"
                            target="_blank"
                        >
                            {createdPollUrl}
                        </Link>
                        {'. '}
                        Would you like to go to the newly created vote?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => onClear()}>
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
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PollCreationPage;
