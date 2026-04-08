export const ERROR_MESSAGES = {
    choiceNamesRequired: 'Choice names are required.',
    duplicateChoiceNames: 'Choice names must be unique.',
    duplicateVoteSubmission:
        'Vote has already been submitted for one or more selected choices.',
    emptyVoteSubmission: 'You must submit at least one vote.',
    invalidPollId: 'Invalid poll ID.',
    noValidVotes: 'You must submit at least one valid vote.',
    notEnoughChoices: 'Not enough choices.',
    organizerTokenRequired: 'Organizer token is required.',
    organizerUnauthorizedToEndPoll: 'Only the organizer can end this poll.',
    pollEnded: 'This poll has already ended.',
    pollNameRequired: 'Poll name is required.',
    pollNotFound: 'Poll not found.',
    pollSlugGenerationFailed:
        'Unable to create poll because all generated slug candidates are already in use.',
    voterNameRequired: 'Voter name is required.',
} as const;
