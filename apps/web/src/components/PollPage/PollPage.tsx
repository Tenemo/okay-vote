import { type ReactElement, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Replay as ReplayIcon,
    ContentCopy as CopyIcon,
} from '@mui/icons-material';
import {
    Typography,
    List,
    Box,
    Button,
    TextField,
    IconButton,
    Alert,
    CircularProgress,
    InputAdornment,
    FormControl,
    OutlinedInput,
    FormHelperText,
    Tooltip,
    Container,
} from '@mui/material';
import copy from 'copy-to-clipboard';
import { Helmet } from 'react-helmet-async';

import VoteItem from 'components/VoteItem';
import VoteResults from 'components/VoteResults';
import { useGetPollQuery, useVoteMutation } from 'store/pollsApi';
import { renderError } from 'utils/utils';

export const PollPage = (): ReactElement => {
    const [selectedScores, setSelectedScores] = useState<
        Record<string, number>
    >({});
    const [voterName, setVoterName] = useState('');
    const [isResultsVisible, setIsResultsVisible] = useState(false);
    const { pollId } = useParams();

    if (!pollId) {
        throw new Error('Poll ID is required.');
    }

    const pollUrl = window.location.href;

    const {
        data: poll,
        error,
        isFetching,
        isLoading,
        refetch,
    } = useGetPollQuery(pollId, {
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
        void submitVote({
            pollId,
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
        <Box
            component="main"
            sx={{
                width: '100%',
                pb: 4,
            }}
        >
            <Helmet>
                <title>
                    {poll
                        ? poll.pollName
                        : `Vote ${pollId.split('-')[0] ?? ''}`}
                </title>
            </Helmet>
            <Container maxWidth="md">
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                    }}
                >
                    <Button
                        disabled={isFetching}
                        onClick={onReload}
                        startIcon={<ReplayIcon />}
                        sx={{ m: 2 }}
                        variant="outlined"
                    >
                        Refresh vote
                    </Button>
                    {poll?.results && !isResultsVisible && (
                        <Button
                            onClick={() => setIsResultsVisible(true)}
                            sx={{ m: 2 }}
                            variant="outlined"
                        >
                            Show current results
                        </Button>
                    )}
                </Box>
            </Container>
            {!poll && isLoading && <CircularProgress sx={{ mt: 5 }} />}
            {!poll && error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {renderError(error)}
                </Alert>
            )}
            {poll && (
                <Container maxWidth="md">
                    <Box sx={{ width: '100%', p: 2 }}>
                        <FormControl
                            sx={{
                                alignSelf: 'flex-start',
                                width: '100%',
                            }}
                            variant="filled"
                        >
                            <OutlinedInput
                                aria-describedby="copy-page-link-helper-text"
                                endAdornment={
                                    <InputAdornment position="end">
                                        <Tooltip title="Copy to clipboard">
                                            <IconButton
                                                aria-label="copy page link"
                                                edge="end"
                                                onClick={() => copy(pollUrl)}
                                            >
                                                <CopyIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                }
                                inputProps={{ readOnly: true }}
                                size="small"
                                value={pollUrl}
                            />
                            <FormHelperText id="copy-page-link-helper-text">
                                Link to the vote to share with others
                            </FormHelperText>
                        </FormControl>
                    </Box>

                    <Typography sx={{ py: 1, px: 2 }} variant="h5">
                        {poll.pollName}
                    </Typography>

                    {hasSubmittedVote && (
                        <Typography
                            sx={{ py: 1, px: 2, fontWeight: 700 }}
                            variant="body1"
                        >
                            You have voted successfully.
                        </Typography>
                    )}
                    <Typography
                        sx={{ py: 1, px: 2, textAlign: 'center' }}
                        variant="body1"
                    >
                        {!hasSubmittedVote &&
                            'Rate choices from 1 to 10. You do not have to vote on every single item. The results will be ranked by geometric mean of all votes per item.'}{' '}
                        {!isResultsVisible &&
                            !poll.results &&
                            'Voting results are available when at least two participants have voted.'}
                    </Typography>
                    {!!poll.voters.length && (
                        <Typography sx={{ py: 1, px: 2 }} variant="body1">
                            Voters who submitted their votes:{' '}
                            {poll.voters.join(', ')}.
                        </Typography>
                    )}

                    {isResultsVisible && poll.results && (
                        <VoteResults results={poll.results} />
                    )}
                    {!hasSubmittedVote && (
                        <>
                            <List sx={{ width: '100%' }}>
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
                            </List>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                }}
                            >
                                <TextField
                                    id="voterName"
                                    inputProps={{ maxLength: 32 }}
                                    label="Voter name*"
                                    name="voterName"
                                    onChange={({ target: { value } }) =>
                                        setVoterName(value)
                                    }
                                    sx={{
                                        m: 2,
                                        minWidth: {
                                            xs: 'calc(100% - 32px)',
                                            sm: 280,
                                        },
                                    }}
                                    value={voterName}
                                />
                                <Button
                                    disabled={!isSubmitEnabled}
                                    onClick={onSubmit}
                                    size="large"
                                    sx={{ m: 2 }}
                                    variant="contained"
                                >
                                    Submit your choices
                                </Button>
                            </Box>
                            {isVoting && <CircularProgress sx={{ m: 2 }} />}
                            {voteError && (
                                <Alert severity="error" sx={{ m: 2 }}>
                                    {renderError(voteError)}
                                </Alert>
                            )}
                        </>
                    )}
                </Container>
            )}
        </Box>
    );
};

export default PollPage;
